import React, { createContext, useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DateAvailabilityContext = createContext();

export const DateAvailabilityProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [dateStatuses, setDateStatuses] = useState({});
    const [userData, setUserData] = useState(null);

    const currentTaskIdRef = useRef(null);
    const isFetchingRef = useRef(false);
    const nextFetchTimeRef = useRef(0);

    // Function to check if fetching is allowed
    const canFetchDateAvailability = useCallback(() => {
        const now = Date.now();
        const result = !isFetchingRef.current &&
            !currentTaskIdRef.current &&
            (nextFetchTimeRef.current === 0 || now >= nextFetchTimeRef.current);
        console.log('canFetchDateAvailability:', result);
        return result;
    }, []);

    // Function to fetch available dates
    const fetchDateAvailability = useCallback(async (overrideTimeLimit = false, forceExecute = false) => {
        const now = new Date();
        const hours = now.getHours();

        if (hours >= 0 && hours < 6) {
            console.log('fetchDateAvailability zablokowane z powodu godzin nocnych');
            return;
        }

        console.log('Wywołano fetchDateAvailability');

        if (!overrideTimeLimit && !forceExecute && !canFetchDateAvailability()) {
            console.log('Zapytanie jest blokowane przez limit czasu lub inne wywołanie.');
            return;
        }

        isFetchingRef.current = true;
        setLoading(true);

        let fetchDelay = 15 * 60 * 1000; // 15 minut

        try {
            // Pobierz dane użytkownika z AsyncStorage
            const userDataString = await AsyncStorage.getItem('userData');
            if (!userDataString) throw new Error('Brak danych użytkownika w pamięci lokalnej.');

            const parsedUserData = JSON.parse(userDataString);
            console.log('Dane użytkownika:', parsedUserData);

            const { licenseNumber, _id: userId } = parsedUserData;
            if (!licenseNumber || !userId) throw new Error('Brak numeru prawa jazdy lub identyfikatora użytkownika.');

            setUserData(parsedUserData);

            // Pobierz szczegóły użytkownika z backendu
            const userResponse = await fetch(
                'https://drive-test-3bee5c1b0f36.herokuapp.com/api/getUser',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ licenseNumber }),
                }
            );

            if (!userResponse.ok) {
                const errorData = await userResponse.json();
                throw new Error(errorData.message || 'Błąd pobierania danych użytkownika.');
            }

            const userDataFromDB = await userResponse.json();
            console.log('Pobrane dane użytkownika z bazy:', userDataFromDB);

            const { applicationRef, selectedCentres, availability } = userDataFromDB;
            if (!applicationRef || !selectedCentres || !availability) {
                throw new Error('Brak wymaganych danych w bazie.');
            }

            const selectedDates = Object.keys(availability);
            if (selectedDates.length === 0) {
                throw new Error('Brak dostępnych dat w availability.');
            }

            // Przygotowanie danych do wysłania
            const requestData = {
                licenseNumber,
                applicationRef,
                selectedDates,
                selectedCentres,
                userId, // Przekazujemy identyfikator użytkownika
            };

            console.log('Dane wysyłane do /date:', requestData);

            // Wyślij zapytanie do backendu
            const startResponse = await fetch(
                'https://drive-test-3bee5c1b0f36.herokuapp.com/date',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestData),
                }
            );

            if (startResponse.ok) {
                const data = await startResponse.json();
                const taskId = data.taskId;

                currentTaskIdRef.current = taskId; // Zapisz taskId
                console.log('Zapytanie rozpoczęte, taskId:', taskId);
            } else {
                const errorData = await startResponse.json();
                throw new Error(errorData.message || 'Nie udało się rozpocząć zadania.');
            }
        } catch (error) {
            console.error('Błąd podczas fetchDateAvailability:', error.message);
            setErrorMessage(error.message || 'Wystąpił błąd podczas pobierania dat.');
            fetchDelay = 5 * 60 * 1000; // Skróć czas do 5 minut w przypadku błędu
        } finally {
            isFetchingRef.current = false;
            setLoading(false);

            // Ustaw czas następnego dozwolonego wywołania
            nextFetchTimeRef.current = Date.now() + fetchDelay;
        }
    }, [canFetchDateAvailability]);


    // Function to check the task status
    const checkTaskStatus = useCallback((taskId, selectedDates) => {
        const intervalId = setInterval(async () => {
            try {
                const response = await fetch(
                    `https://drive-test-3bee5c1b0f36.herokuapp.com/taskDate-status/${taskId}`
                );

                if (response.ok) {
                    const data = await response.json();

                    if (data.status === 'completed') {
                        console.log('Task completed:', data);

                        const results = data.results || {}; // Assume results is an object with dates and time slots
                        setDateStatuses((prevStatuses) => {
                            const updatedStatuses = { ...prevStatuses };
                            Object.keys(results).forEach((date) => {
                                if (results[date] && results[date].length > 0) {
                                    updatedStatuses[date] = {
                                        status: 'available',
                                        timeSlots: results[date],
                                    };
                                } else {
                                    updatedStatuses[date] = {
                                        status: 'unavailable',
                                        timeSlots: [],
                                    };
                                }
                            });
                            return updatedStatuses;
                        });

                        clearInterval(intervalId);
                        currentTaskIdRef.current = null;
                    } else if (data.status === 'failed') {
                        console.log('Task failed:', data);

                        setDateStatuses((prevStatuses) => {
                            const updatedStatuses = { ...prevStatuses };
                            selectedDates.forEach((date) => {
                                updatedStatuses[date] = {
                                    status: 'unavailable',
                                    timeSlots: [],
                                };
                            });
                            return updatedStatuses;
                        });

                        clearInterval(intervalId);
                        currentTaskIdRef.current = null;
                    }
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch task status.');
                }
            } catch (error) {
                console.error('Error checking task status:', error);
                clearInterval(intervalId);
                currentTaskIdRef.current = null;
            }
        }, 5000); // Check every 5 seconds
    }, []);

    // Effect to initialize fetching on app start
    useEffect(() => {
        const isWithinAllowedHours = () => {
            const now = new Date();
            const hours = now.getHours();
            return hours >= 6 && hours < 24; // Zakres godzin od 6:00 do 23:59
        };

        let intervalId;

        const startInterval = () => {
            intervalId = setInterval(() => {
                console.log('Interwał: Próba wywołania fetchDateAvailability');

                if (!isWithinAllowedHours()) {
                    console.log('fetchDateAvailability zablokowane z powodu nieodpowiednich godzin');
                    return;
                }

                if (canFetchDateAvailability()) {
                    console.log('fetchDateAvailability w interwale');
                    fetchDateAvailability(true); // Wymuś wykonanie
                } else {
                    console.log('fetchDateAvailability zablokowane przez warunek canFetchDateAvailability');
                }
            }, 15 * 60 * 1000); // 15 minut
        };


        // Uruchom fetch na starcie, a potem interwał
        if (canFetchDateAvailability()) {
            fetchDateAvailability();
        }
        startInterval();

        return () => {
            console.log('Czyszczenie interwału');
            clearInterval(intervalId);
        };
    }, [fetchDateAvailability, canFetchDateAvailability]);



    return (
        <DateAvailabilityContext.Provider
            value={{
                loading,
                errorMessage,
                dateStatuses,
                userData,
                fetchDateAvailability,
                canFetchDateAvailability,
            }}
        >
            {children}
        </DateAvailabilityContext.Provider>
    );
};
