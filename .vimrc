set hlsearch
set number
set scrolloff=1000
set laststatus=2
set tags=.tags;
set showcmd
set foldmethod=marker
set linebreak
set history=1000
set helplang=ja
set keywordprg=:help
highlight StatusLine cterm=bold,reverse
highlight StatusLine ctermfg=blue
highlight StatusLine ctermbg=white
highlight StatusLineNC cterm=reverse
autocmd InsertEnter * highlight StatusLine ctermfg=green
autocmd InsertLeave * highlight StatusLine ctermfg=blue
autocmd FileType help nnoremap <buffer> q <C-w>c
set showtabline=2
let &statusline = ''
let &statusline .= '%<%F %h%m%r%w'
let &statusline .= '%='
let &statusline .= '%y' " filetype
let &statusline .= '[%{&fileencoding == "" ? &encoding : &fileencoding}]'
let &statusline .= '[%{&fileformat}]'
let &statusline .= '  %-14.(%l,%c%V%) %P'
inoremap <C-H> <Backspace>
syntax on
set incsearch   " 検索文字を打ち込むと即検索する（インクリメンタルサーチ）
set infercase
set wildmenu    " :e .v<TAB><TAB> した時に補完候補を表示
set wildmode=list:longest,full
set directory=~/tmp " swpファイル出力場所
"" ポップアップメニューのカラーを設定
hi Pmenu guibg=#666666
hi PmenuSel guibg=#8cd0d3 guifg=#666666
hi PmenuSbar guibg=#333333"

" -------------------
"" 色の設定
"" -------------------
highlight LineNr ctermfg=darkyellow    " 行番号
highlight NonText ctermfg=darkgrey
highlight Folded ctermfg=blue
highlight SpecialKey cterm=underline ctermfg=darkgrey
highlight SpecialKey ctermfg=grey " 特殊記号

" 全角空白と行末の空白の色を変える
highlight WhitespaceEOL ctermbg=red guibg=red
match WhitespaceEOL /\s\+$/
autocmd WinEnter * match WhitespaceEOL /\s\+$/
"行頭のスペースの連続をハイライトさせる
"Tab文字も区別されずにハイライトされるので、区別したいときはTab文字の表示を別に
"設定する必要がある。
function! SOLSpaceHilight()
    syntax match SOLSpace "^\s\+" display containedin=ALL
    highlight SOLSpace term=underline ctermbg=LightGray
endf
"全角スペースをハイライトさせる。
function! JISX0208SpaceHilight()
    syntax match JISX0208Space "　" display containedin=ALL
    highlight JISX0208Space term=underline ctermbg=LightCyan
endf
"syntaxの有無をチェックし、新規バッファと新規読み込み時にハイライトさせる
if has("syntax")
    syntax on
        augroup invisible
        autocmd! invisible
        "autocmd BufNew,BufRead * call SOLSpaceHilight()
        autocmd BufNew,BufRead * call JISX0208SpaceHilight()
    augroup END
endif

"" タブ幅
set expandtab
set shiftwidth=4
set softtabstop=4
set tabstop=8
"" タブ文字と改行文字を表示(^I,$)
set list
"" 検索時に大文字小文字区別しない
set ignorecase
"" 後方検索時に文字列が見つからない場合にファイルの先頭に戻って再検索する
set wrapscan
set modifiable
set fencs=utf-8,cp932,ucs-bom,ucs-2le,ucs-2,iso-2022-jp-3
filetype plugin indent on 
"挿入モードで貼り付け
imap <C-V>  <ESC>"*pa
"カーソル移動
cnoremap <C-h> <Backspace>
cnoremap <C-l> <Right>
cnoremap <C-j> <Down>
cnoremap <C-k> <Up>
cnoremap <C-b> <Left>
cnoremap <C-a> <Home>
cnoremap <C-e> <End>
cnoremap <C-d> <Del>

"コマンドモードの履歴
cnoremap <C-p> <Up>
cnoremap <C-n> <Down>

"map <C-i> :Gtags -f %<CR>
map <C-g> :GtagsCursor<CR>
map <C-n> :cn<CR>
map <C-p> :cp<CR>

let g:Align_xstrlen = 3
set viminfo+=!
:map <silent> <C-T> :call BufferList()<CR>
" C/Migemo
if has('migemo')
    set migemo
    set migemodict=$VIM/dict/utf-8.d/migemo-dict
endif
"-------------------------------------------------------------------
"Screenのステータスラインに編集中のファイルを表示し、
" 終了時にはShellと表示する。※^[ はctrl + v を押しながら [
"-------------------------------------------------------------------
function! SetScreenTabName(name)
    let arg = 'k' . a:name . ' > vim \\'
    silent! exe '!echo -n "' . arg . "\""
endfunction
"Screenの場合にvimを使用した時にスクリーンタブ名を書き換える
if &term =~ "screen"
  autocmd VimLeave * call SetScreenTabName('shell')
  autocmd BufEnter * if bufname("") !~ "^\[A-Za-z0-9\]*://" | call SetScreenTabName("%") | endif
endif
""コンソールラインを必要な時だけ表示する
""http://d.hatena.ne.jp/thinca/20090530/1243615055
set cursorline
highlight CursorLine cterm=inverse
augroup vimrc-auto-cursorline
  autocmd!
  autocmd CursorMoved,CursorMovedI * call s:auto_cursorline('CursorMoved')
  autocmd CursorHold,CursorHoldI * call s:auto_cursorline('CursorHold')
  autocmd WinEnter * call s:auto_cursorline('WinEnter')
  autocmd WinLeave * call s:auto_cursorline('WinLeave')

  let s:cursorline_lock = 0
  function! s:auto_cursorline(event)
    if a:event ==# 'WinEnter'
      setlocal cursorline
      let s:cursorline_lock = 2
    elseif a:event ==# 'WinLeave'
      setlocal nocursorline
    elseif a:event ==# 'CursorMoved'
      if s:cursorline_lock
        if 1 < s:cursorline_lock
          let s:cursorline_lock = 1
        else
          setlocal nocursorline
          let s:cursorline_lock = 0
        endif
      endif
    elseif a:event ==# 'CursorHold'
      setlocal cursorline
      let s:cursorline_lock = 1
    endif
  endfunction
augroup END
"自動的に QuickFix リストを表示する
autocmd QuickfixCmdPost make,grep,grepadd,vimgrep,vimgrepadd cwin
autocmd QuickfixCmdPost lmake,lgrep,lgrepadd,lvimgrep,lvimgrepadd lwin
if has("autocmd")
      autocmd FileType python set complete+=k/home/yoshinoya/pydiction-0.5/pydiction iskeyword+=.,(
endif " has("autocmd")


