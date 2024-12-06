import React, { createContext, useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DateAvailabilityContext = createContext();

export const DateAvailabilityProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [dateStatuses, setDateStatuses] = useState({});
    const [userData, setUserData] = useState(null);

    const isFetchingRef = useRef(false);
    const nextFetchTimeRef = useRef(0);
    const intervalIdRef = useRef(null); // Przechowuje identyfikator interwału

    // Function to check if fetching is allowed
    const canFetchDateAvailability = useCallback(() => {
        const now = Date.now();
        console.log('Sprawdzam warunki canFetchDateAvailability:');
        console.log('isFetchingRef.current:', isFetchingRef.current); // Powinno być false po zakończeniu
        console.log('nextFetchTimeRef.current:', nextFetchTimeRef.current, 'Teraz:', now); // Powinno być <= now
        const result = !isFetchingRef.current &&
            (nextFetchTimeRef.current === 0 || now >= nextFetchTimeRef.current);
        console.log('Wynik canFetchDateAvailability:', result);
        return result;
    }, []);

    // Function to fetch available dates
    const fetchDateAvailability = useCallback(async (overrideTimeLimit = false, forceExecute = false) => {
        if (intervalIdRef.current) {
            console.log('Resetowanie interwału');
            clearInterval(intervalIdRef.current); // Wyczyszczenie istniejącego interwału
            intervalIdRef.current = setInterval(() => {
                console.log('Interwał: Próba wywołania fetchDateAvailability');
                fetchDateAvailability(true); // Wymuś wykonanie w interwale
            }, 15 * 60 * 1000); // 15 minut
        }

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
                console.log('Zapytanie wysłane pomyślnie.');
            } else {
                const errorData = await startResponse.json();
                throw new Error(errorData.message || 'Nie udało się rozpocząć zadania.');
            }
        } catch (error) {
            console.error('Błąd podczas fetchDateAvailability:', error.message);
            setErrorMessage(error.message || 'Wystąpił błąd podczas pobierania dat.');
        } finally {
            console.log('Czyszczenie stanu po fetchDateAvailability');
            isFetchingRef.current = false; // Usuwa blokadę
            nextFetchTimeRef.current = Date.now() + 15 * 60 * 1000; // Ustaw limit 15 minut
            console.log('Zaktualizowano nextFetchTimeRef:', nextFetchTimeRef.current);
            setLoading(false);
        }
    }, [canFetchDateAvailability]);


    // Effect to initialize fetching on app start
    useEffect(() => {
        console.log('Inicjalizuję efekt dla fetchDateAvailability co 15 minut');

        intervalIdRef.current = setInterval(() => {
            console.log('Interwał: Próba wywołania fetchDateAvailability');
            fetchDateAvailability(true); // Wymuś wykonanie w interwale
        }, 15 * 60 * 1000); // 15 minut

        return () => {
            console.log('Czyszczenie interwału');
            clearInterval(intervalIdRef.current); // Wyczyszczenie interwału przy odmontowaniu
        };
    }, [fetchDateAvailability]);




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
