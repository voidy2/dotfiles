if [ -x `which zsh` ]; then
    echo '[switch login shell] bash -> zsh'
    exec zsh
fi
