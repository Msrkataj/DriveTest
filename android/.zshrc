# Ustawienia dla Homebrew
export PATH="/opt/homebrew/bin:$PATH"

# Ustawienia dla Java (dla JDK 23)

export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export PATH="$JAVA_HOME/bin:$PATH"

# Ustawienia dla Android SDK
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$ANDROID_HOME/platform-tools:$PATH"
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$PATH

# Ustawienia dla Ruby (Homebrew)
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"

# Ustawienia dla NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# Limit otwartych plików
ulimit -n 10000

export PATH=$PATH:/usr/local/bin
export PATH=$PATH:/Users/kamalogic/.npm-global/bin
export JAVA_HOME="/usr/local/opt/openjdk/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
