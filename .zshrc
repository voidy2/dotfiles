## Completion configuration
autoload -U compinit
compinit
##色付けプロンプト
local DEFAULT=$'%{[m%}'
local RED=$'%{[1;31m%}'
local GREEN=$'%{[1;32m%}'
local YELLOW=$'%{[1;33m%}'
local BLUE=$'%{[1;34m%}'
local PURPLE=$'%{[1;35m%}'
local LIGHT_BLUE=$'%{[1;36m%}'
local WHITE=$'%{[1;37m%}'

# users generic .zshrc file for zsh(1)
#PROMPT="%{[$[32+$RANDOM % 5]m%}$LOGNAME@%m%B[%D %T]:%b% "
#PROMPT="%{[$[32+$RANDOM % 5]m%}[%D %T]"$YELLOW" %% "$DEFAULT
PROMPT="%{[$[32+$RANDOM % 5]m%}[%D %T]"$DEFAULT"[$GREEN"INS"$DEFAULT] $YELLOW%%$DEFAULT "
if [ $USER = "root" ]
then
    PROMPT="%{[$[31]m%}%B$LOGNAME@%m[%D %T]:%b%{[m%} %h# "
    RPROMPT="[%{[31m%}%~%{[m%}]"
    PATH=${PATH}:/sbin:/usr/sbin:/usr/local/sbin
    HOME=/root
else
     RPROMPT="[%{[33m%}%~%{[m%}]"
fi

function zle-line-init zle-keymap-select {
  case $KEYMAP in
    vicmd)
    PROMPT="%{[$[32+$RANDOM % 5]m%}[%D %T]"$DEFAULT"[$BLUE"NOR"$DEFAULT] $YELLOW%%$DEFAULT "
    ;;
    main|viins)
    PROMPT="%{[$[32+$RANDOM % 5]m%}[%D %T]"$DEFAULT"[$GREEN"INS"$DEFAULT] $YELLOW%%$DEFAULT "
    ;;
  esac
  zle reset-prompt
}
zle -N zle-line-init
zle -N zle-keymap-select


_set_env_git_current_branch() {
  GIT_CURRENT_BRANCH=$( git branch &> /dev/null | grep '^\*' | cut -b 3- )
}

_update_rprompt() {
  if [ "`git ls-files 2>/dev/null`" ]; then
     RPROMPT="[%{[33m%}%~:%{[32m%}$GIT_CURRENT_BRANCH%{[m%}]"
  else
     RPROMPT="[%{[33m%}%~%{[m%}]"
  fi
}

precmd()
{
  _set_env_git_current_branch
  _update_rprompt
}

chpwd()
{
  _set_env_git_current_branch
  _update_rprompt
}
alias update='sudo apt-get update'
alias upgrade='sudo apt-get upgrade'
#grepにtagsファイルが引っかからないようにする
alias ctags='ctags -f .tags'
# http://d.hatena.ne.jp/f99aq/20090418/1240067145
# .を何回か押すと上の階層へ
rationalise-dot() {
    if [[ $LBUFFER = *.. ]]; then
        LBUFFER+=/..
    else
        LBUFFER+=.
    fi
}
zle -N rationalise-dot
bindkey . rationalise-dot


## Environment variable configuration
#
# LANG
export LANG=ja_JP.UTF-8

cdpath=(.. ~ ~/myapp/gae/ ~/myapp/gae/google_appengine/demos/)
PATH=~/local/bin:$PATH
PATH=~/lib/flex/bin:$PATH
PATH=~/local/bin:$PATH
PATH=/var/lib/gems/1.8/bin:$PATH
PATH=~/myapp/android-sdk-linux_x86/tools:$PATH
PATH=~/atlassian-plugin-sdk-3.3/bin:$PATH
FLEX_HOME=~/lib/flex
export GREP_OPTIONS="--color=auto"
export STAX_HOME=~/stax-sdk-0.2.14
PATH=~/stax-sdk-0.2.14:$PATH
export JAVA_HOME=/usr/lib/jvm/java-6-sun/

#パスを編集するときに階層毎に
#単語を消したり移動できたりできるようにする
WORDCHARS="*?_-.[]~=&;!#$%^(){}<>"

# auto change directory
setopt auto_cd

# auto directory pushd that you can get dirs list by cd -[tab]
setopt auto_pushd

# command correct edition before each completion attempt
setopt correct

# compacked complete list display
setopt list_packed

# no remove postfix slash of command line
setopt noautoremoveslash

# no beep sound when complete list displayed
setopt nolistbeep

setopt print_eight_bit
# 拡張グロブで補完
setopt extended_glob
# 明確なドットの指定なしで.から始まるファイルをマッチ
setopt globdots

## Keybind configuration
#
# emacs like keybind (e.x. Ctrl-a goes to head of a line and Ctrl-e goes
# to end of it)

bindkey -v
# historical backward/forward search with linehead string binded to ^P/^N
autoload history-search-end

zle -N history-beginning-search-backward-end history-search-end
zle -N history-beginning-search-forward-end history-search-end
bindkey "^p" history-beginning-search-backward-end
bindkey "^n" history-beginning-search-forward-end
#bindkey "\\ep" history-beginning-search-backward-end
#bindkey "\\en" history-beginning-search-forward-end
bindkey "\\vp" history-beginning-search-backward-end
bindkey "\\vn" history-beginning-search-forward-end
bindkey "^r" history-incremental-search-backward
#bindkey "^w"  backward-kill-word
bindkey -a 'H' run-help
bindkey -a 'q' push-line


## Command history configuration
HISTFILE=~/.zsh_history
HISTSIZE=10000
SAVEHIST=10000

## Alias configuration
#
# expand aliases before completing
#
setopt complete_aliases # aliased ls needs if file/dir completions work

alias where="command -v"
alias j="jobs -l"

case "${OSTYPE}" in
freebsd*|darwin*)
  alias ls="ls -F -G -w"
  ;;
linux*)
  alias ls="ls -F --color"
  ;;
esac

alias la="ls -a"
alias lf="ls -F"
alias ll="ls -l"

alias du="du -h"
alias df="df -h"

alias su="su -l"

alias screen='TERM=screen screen'


## terminal configuration
#
unset LSCOLORS
case "${TERM}" in
xterm)
  export TERM=xterm-color
  ;;
kterm)
  export TERM=kterm-color
  # set BackSpace control character
  stty erase
  ;;
cons25)
  unset LANG
  export LSCOLORS=ExFxCxdxBxegedabagacad
  export LS_COLORS='di=01;34:ln=01;35:so=01;32:ex=01;31:bd=46;34:cd=43;34:su=41;30:sg=46;30:tw=42;30:ow=43;30'
  zstyle ':completion:*' list-colors \
    'di=;34;1' 'ln=;35;1' 'so=;32;1' 'ex=31;1' 'bd=46;34' 'cd=43;34'
  ;;
esac

# set terminal title including current directory
#
case "${TERM}" in
kterm*|xterm*|screen)
  precmd() {
    echo -ne "\033]0;${USER}@${HOST%%.*}:${PWD}\007"
    _set_env_git_current_branch
    _update_rprompt
  }
  export LSCOLORS=exfxcxdxbxegedabagacad
  export LS_COLORS='di=34:ln=35:so=32:pi=33:ex=31:bd=46;34:cd=43;34:su=41;30:sg=46;30:tw=42;30:ow=43;30'
  ;;
esac

alias less='/usr/share/vim/vim71/macros/less.sh'
function cd(){
    builtin cd $@ && ls;
}
zstyle ':completion:*' list-colors ${(s.:.)LS_COLORS}
#screenセッション保存先
export SCREENDIR=~/.screen
#大文字小文字区別しないかつ大文字打ったら大文字限定
zstyle ':completion:*' matcher-list 'm:{a-z}={A-Z}'
#一部のコマンドライン定義は、展開時に時間のかかる処理を行う。
#いくつかのコマンドでは~/.zcompcacheディレクトリに 補完候補のキャッシュを生成してくれる。
#対応しているのは、
#    * apt-get, dpkg (Debian)
#    * rpm (Redhat)
#    * urpmi (Mandrake)
#    * perlの-Mオプション
#    * bogofilter (zsh 4.2.1以降)
#    * fink, mac_apps (MacOS X)(zsh 4.2.2以降)
#のみ。
zstyle ':completion:*' use-cache true
# カレントディレクトリに候補がない場合のみ cdpath 上のディレクトリを候補
zstyle ':completion:*:cd:*' tag-order local-directories path-directories
# 補完候補を ←↓↑→ で選択 (補完候補が色分け表示される)
zstyle ':completion:*:default' menu select=2
# 補完関数の表示を過剰にする
zstyle ':completion:*' verbose yes
zstyle ':completion:*' word yes
#manの補完がセクション別に補完表示されるようになる
zstyle ':completion:*:manuals' separate-sections true
#Completer(補完システム)設定
#_complete
#    普通の補完関数
#_approximate
#    ミススペルを訂正した上で補完を行う。
#_expand
#    グロブや変数の展開を行う。もともとあった展開と比べて、細かい制御が可能
#_history
#    履歴から補完を行う。_history_complete_wordから使われる
#_prefix
#    カーソルの位置で補完を行う
zstyle ':completion:*' completer _oldlist _expand _complete _match _prefix _approximate _list _history
zstyle ':completion:*:messages' format $YELLOW'%d'$DEFAULT
zstyle ':completion:*:warnings' format $RED'No matches for:'$YELLOW' %d'$DEFAULT
zstyle ':completion:*:descriptions' format $YELLOW'completing %B%d%b'$DEFAULT
zstyle ':completion:*:corrections' format $YELLOW'%B%d '$RED'(errors: %e)%b'$DEFAULT
zstyle ':completion:*:options' description 'yes'
# グループ名に空文字列を指定すると，マッチ対象のタグ名がグループ名に使われる。
# したがって，すべての マッチ種別を別々に表示させたいなら以下のようにする
zstyle ':completion:*' group-name ''
# カレントディレクトリに候補がない場合のみ cdpath 上のディレクトリを候補
zstyle ':completion:*:cd:*' tag-order local-directories path-directories
#cd は親ディレクトリからカレントディレクトリを選択しないでしょう (例: cd ../<TAB>):
zstyle ':completion:*:cd:*' ignore-parents parent pwd
#オブジェクトファイルとか中間ファイルとかはfileとして補完させない
zstyle ':completion:*:*files' ignored-patterns '*?.o' '*?~' '*\#'
# 変数添字の中身を展開
# 例えばtest_array=("value1" "value2")と定義して
# $array[ のところで補完させると添字が表示される
zstyle ':completion:*:*:-subscript-:*' tag-order indexes parameters
# セパレータを指定(デフォルトは'--')
zstyle ':completion:*' list-separator '-->'
#補完候補リスト中で補完する場合に、次の補完候補が表示しきれないとき
#タブをおすと画面が更新されて補完候補が表示され、それ以外の場合は文字を
#挿入することを表示するおせっかいな機能
#zstyle ':completion:*' list-prompt '%SAt %p: Hit TAB for more, or the character to insert%s'

#         1つの引数を取るオプション自身の説明文字列が補完定義
#          に 与えられていないとき，そのオプションの引数の方に
#          説明文字列があればそれオプション自身の説明として 使
#          う。 スタイルの値に含ませる %d がその文字列に置き換
#          えられる(□)。
zstyle ':completion:*' auto-description 'specify: %d'
#       insert-tab
#          この値が `true' のとき，カーソルの左側に非空白文 字
#          が な い 状態で TABキーを押すと，補完を始める代わり
#          にTAB文字を挿入する。 `false' ならそのような場所 で
#          も補完を行なう。
zstyle ':completion:*' insert-tab false
# kill コマンドの命令に色を付ける
zstyle ':completion:*:*:kill:*:processes' list-colors '=(#b) #([%0-9]#)*=0=01;31'
# killコマンドで補完候補を表示
zstyle ':completion:*:processes' command 'ps x -o pid,s,args'

setopt hist_ignore_all_dups  # 重複するコマンド行は古い方を削除
setopt hist_ignore_dups      # 直前と同じコマンドラインはヒストリに追加しない
setopt hist_ignore_space     # スペースで始まるコマンド行はヒストリリストから削除
setopt share_history         # 履歴の共有
setopt inc_append_history    # 履歴をインクリメンタルに追加
setopt hist_reduce_blanks    # 余分な空白は詰めて記録
setopt hist_save_no_dups     # ヒストリファイルに書き出すときに、古いコマンドと同じものは無視する。
setopt hist_no_store         # historyコマンドは履歴に登録しない
setopt hist_expand           # 補完時にヒストリを自動的に展開

setopt auto_param_slash      # ディレクトリ名の補完で末尾の / を自動的に付加し、次の補完に備える
setopt mark_dirs             # ファイル名の展開でディレクトリにマッチした場合 末尾に / を付加
setopt list_types            # 補完候補一覧でファイルの種別を識別マーク表示 (訳注:ls -F の記号)
setopt auto_menu             # 補完キー連打で順に補完候補を自動で補完
setopt auto_param_keys       # カッコの対応などを自動的に補完
setopt interactive_comments  # コマンドラインでも # 以降をコメントと見なす
setopt magic_equal_subst     # コマンドラインの引数で --prefix=/usr などの = 以降でも補完できる

setopt complete_in_word      # 語の途中でもカーソル位置で補完
setopt always_last_prompt    # カーソル位置は保持したままファイル名一覧を順次その場で表示

bindkey "^I" menu-complete   # 展開する前に補完候補を出させる ""reverse-menu-complete
# zsh + screen で端末に表示されてる文字列を補完する
# 端末上に表示されている画面から Ctrl + o で補完することができるようになります。
# dabbrev
# via http://d.hatena.ne.jp/secondlife/20060108/1136650653
HARDCOPYFILE=$HOME/tmp/screen-hardcopy
touch $HARDCOPYFILE

dabbrev-complete () {
        local reply lines=80 # 80行分
        screen -X eval "hardcopy -h $HARDCOPYFILE"
        reply=($(sed '/^$/d' $HARDCOPYFILE | sed '$ d' | tail -$lines))
        compadd - "${reply[@]%[*/=@|]}"
}
zle -C dabbrev-complete menu-complete dabbrev-complete
bindkey '^o' dabbrev-complete
bindkey '^o^_' reverse-menu-complete

#zsh起動直後にscreen起動
if [ $SHLVL = 1 ];then
      screen
fi
# ステータスラインに各screenで打ったコマンドを表示
if [ "$TERM" = "screen" ]; then
    chpwd () { echo -n "_`dirs`\\" }
    preexec() {
        # see [zsh-workers:13180]
        # http://www.zsh.org/mla/workers/2000/msg03993.html
        emulate -L zsh
        local -a cmd; cmd=(${(z)2})
        case $cmd[1] in
            fg)
                if (( $#cmd == 1 )); then
                    cmd=(builtin jobs -l %+)
                else
                    cmd=(builtin jobs -l $cmd[2])
                fi
                ;;
            %*)
                cmd=(builtin jobs -l $cmd[1])
                ;;
            cd)
                if (( $#cmd == 2)); then
                    cmd[1]=$cmd[2]
                fi
                ;&
            *)
                echo -n "k$cmd[1]:t\\"
                return
                ;;
        esac

        local -A jt; jt=(${(kv)jobtexts})

        $cmd >>(read num rest
            cmd=(${(z)${(e):-\$jt$num}})
            echo -n "k$cmd[1]:t\\") 2>/dev/null
    }
    chpwd
fi

# git completion
#autoload bashcompinit
#bashcompinit
#source ~/git-completion.bash

#source ~/dotfiles/zsh/auto-fu.zsh; zle-line-init () { auto-fu-init; }; zle -N zle-line-init

## load user .zshrc configuration file

[ -f ~/.zshrc.mine ] && source ~/.zshrc.mine

