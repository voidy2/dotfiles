"オートコマンドを初期化
autocmd!

syntax on
filetype plugin indent on
let mapleader=","
"" -------------------
"" 文字エンコーディング
"" -------------------
"{{{
command! -bang -bar -complete=file -nargs=? UTf8
        \ edit<bang> ++enc=utf-8 <args>
command! -bang -bar -complete=file -nargs=? Cp932
        \ edit<bang> ++enc=cp932 <args>
command! -bang -bar -complete=file -nargs=? Eucjp
        \ edit<bang> ++enc=euc-jp <args>
command! -bang -bar -complete=file -nargs=? Iso2022jp
        \ edit<bang> ++enc=iso-2022-jp <args>
command! -bang -bar -complete=file -nargs=? Jis Iso2022jp<bang> <args>
command! -bang -bar -complete=file -nargs=? Sjis Cp932<bang> <args>
"}}}
"" -------------------
"" ハイライト
"" -------------------
"{{{1

"ステータスライン"{{{2
let &statusline = ''
let &statusline .= '%<%F %h%m%r%w'
let &statusline .= '%='
let &statusline .= '%y' " filetype
let &statusline .= '[%{&fileencoding == "" ? &encoding : &fileencoding}]'
let &statusline .= '[%{&fileformat}]'
let &statusline .= '  %-14.(%l,%c%V%) %P'
autocmd ColorScheme *
\ highlight StatusLine
\ cterm=bold,reverse
\ ctermfg=blue
\ ctermbg=white
autocmd ColorScheme * highlight StatusLineNC cterm=reverse
" ステータスラインの色(挿入モード:green,ノーマルモード:blue)
autocmd InsertEnter * highlight StatusLine ctermfg=green
autocmd InsertLeave * highlight StatusLine ctermfg=blue
"}}}

" ポップアップメニュー"{{{2
autocmd ColorScheme * highlight Pmenu ctermbg=lightblue
autocmd ColorScheme * highlight PmenuSel ctermbg=darkgrey
doautocmd ColorScheme _
"}}}

" テキストライン"{{{2
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
endif"}}}

"}}}
"" -------------------
"" オプション
"" -------------------
"{{{
set foldmethod=syntax
set complete=.,w,b,t,i
set completeopt=menu,preview,menuone
set lazyredraw
set hlsearch
set backspace=eol,indent,start
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
set showtabline=2
" 検索文字を打ち込むと即検索する（インクリメンタルサーチ）
set incsearch
" 単語補完時に大文字小文字を上手く区別"
set infercase
" :e .v<TAB><TAB> した時に補完候補を表示
set wildmenu
set wildmode=list:longest,full
" swpファイル出力場所
set directory=~/tmp
"" タブ幅
set expandtab
set shiftwidth=4
set softtabstop=4
set tabstop=8
"" タブ文字と改行文字を表示(^I,$)
set list
"" 検索時に大文字小文字区別しない
set ignorecase
set smartcase

"" 後方検索時に文字列が見つからない場合にファイルの先頭に戻って再検索する
set wrapscan
set modifiable
set fencs=utf-8,cp932,ucs-bom,ucs-2le,ucs-2,iso-2022-jp-3

"}}}
"" -------------------
"" キーマッピング
"" -------------------
"{{{
noremap <leader>. :<C-u>edit ~/dotfiles/.vimrc<CR>
noremap <leader>s :<C-u>source $MYVIMRC<CR>
" ヘルプ表示
autocmd FileType help nnoremap <buffer> q <C-w>c
nnoremap <C-h> :<C-u>help<Space>
nnoremap <C-h><C-h> :<C-u>help<Space><C-r><C-w><CR>
" タブ切り替え
nnoremap <silent> <C-n> :<C-u>tabNext<CR>
nnoremap <silent> <C-p> :<C-u>tabprevious<CR>
nnoremap <silent> tn :<C-u>tabnew<CR>
nnoremap <silent> tq :<C-u>tabclose<CR>
" 表示行単位で移動
noremap j gj
noremap k gk
vnoremap j gj
vnoremap k gk
noremap gj j
noremap gk k
vnoremap gj j
vnoremap gk k
"挿入モードで貼り付け
inoremap <C-v>  <ESC>"*pa
"挿入モードでのEsc割り当て
inoremap jj <Esc>j
inoremap ;; <Esc>
inoremap kk <Esc>k
inoremap hh <Esc>^
"ESC連打で強調表示切る
nnoremap <Esc><Esc> :<C-u>nohlsearch<CR>
nnoremap <C-l> W
nnoremap <leader>w :<C-u>write<CR>
"カーソル移動
cnoremap <C-h> <Backspace>
cnoremap <C-l> <Right>
cnoremap <C-j> <Down>
cnoremap <C-k> <Up>
cnoremap <C-b> <Left>
cnoremap <C-a> <Home>
cnoremap <C-e> <End>
cnoremap <C-d> <Del>
inoremap <C-h> <Backspace>
inoremap <C-l> <Right>
inoremap <C-j> <Down>
inoremap <C-k> <Up>
inoremap <C-b> <C-o>b
inoremap <C-a> <Home>
inoremap <C-f> <Esc>f
inoremap <C-f><C-f> <Esc>F
inoremap :w <Esc>:write<CR>
inoremap <leader>w <Esc>:write<CR>
inoremap <C-e> <End>
inoremap <C-d> <Del>
inoremap <leader>[ [
inoremap <leader>{ {
inoremap <leader>( (
inoremap [ []<LEFT>
inoremap { {}<LEFT><CR><ESC>O
inoremap ( ()<LEFT>
"コマンドモードの履歴
cnoremap <C-p> <Up>
cnoremap <C-n> <Down>
"日付入力
inoremap <expr> <leader>df strftime('%Y-%m-%dT%H:%M:%S')
inoremap <expr> <leader>dd strftime('%Y-%m-%d')
inoremap <expr> <leader>dt strftime('%H:%M:%S')
"最後に変更が行われたテキストを選択
nnoremap gc `[v`]
vnoremap gc :<C-u>normal gc<CR>
onoremap gc :<C-u>normal gc<CR>
"}}}
" Gtags
"map <C-i> :Gtags -f %<CR>
noremap <C-g> :GtagsCursor<CR>
"noremap <C-n> :cn<CR>
"noremap <C-p> :cp<CR>
let g:Align_xstrlen = 3
set viminfo+=!
map <silent> <C-T> :call BufferList()<CR>
" C/Migemo
if has('migemo')
    set migemo
    set migemodict=$VIM/dict/utf-8.d/migemo-dict
endif
" surround.vim
nmap s <Plug>Ysurround
nmap ss <Plug>Yssurround
nmap <leader>q <Plug>Csurround w"
imap <leader>q <Esc><Plug>Csurround w"<Right>wa
nmap <leader>sq <Plug>Csurround w'
imap <leader>sq <Esc><Plug>Csurround w'<Right>wa
""-------------------------------------------------------------------
" Screenのステータスラインに編集中のファイルを表示し、
" 終了時にはShellと表示する。※^[ はctrl + v を押しながら [
"-------------------------------------------------------------------
"{{{
function! SetScreenTabName(name)
    let arg = 'k' . a:name . ' > vim \\'
    silent! exe '!echo -n "' . arg . "\""
endfunction
"Screenの場合にvimを使用した時にスクリーンタブ名を書き換える
if &term =~ "screen"
  autocmd VimLeave * call SetScreenTabName('shell')
  autocmd BufEnter * if bufname("") !~ "^\[A-Za-z0-9\]*://" | call SetScreenTabName("%") | endif
endif
"}}}
""-------------------------------------------------------------------
" コンソールラインを必要な時だけ表示する
" http://d.hatena.ne.jp/thinca/20090530/1243615055
""-------------------------------------------------------------------
"{{{
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
"}}}
"自動的に QuickFix リストを表示する
autocmd QuickfixCmdPost make,grep,grepadd,vimgrep,vimgrepadd cwin
autocmd QuickfixCmdPost lmake,lgrep,lgrepadd,lvimgrep,lvimgrepadd lwin
"{{{
function! SetScreenTabName(name)
    let arg = 'k' . a:name . ' > vim \\'
    silent! exe '!echo -n "' . arg . "\""
endfunction
"Screenの場合にvimを使用した時にスクリーンタブ名を書き換える
if &term =~ "screen"
  autocmd VimLeave * call SetScreenTabName('shell')
  autocmd BufEnter * if bufname("") !~ "^\[A-Za-z0-9\]*://" | call SetScreenTabName("%") | endif
endif
"}}}
"バッファで開かれてるファイルのフルパス
"http://d.hatena.ne.jp/ns9tks/20090904/1252073153
command! YankPath let @* = expand('%:p')

if has("autocmd")
    autocmd FileType python let g:pydiction_location = '~/.vim/pydiction/complete-dict'
endif " has("autocmd")

" Execute python script ,t
function! s:ExecPy()
    exe "!" . &ft . " %"
:endfunction
command! Exec call <SID>ExecPy()
autocmd FileType python nnoremap  <leader>t :call <SID>ExecPy()<CR>

" Use neocomplcache.
let g:NeoComplCache_EnableAtStartup = 1
" Use smartcase.
let g:NeoComplCache_SmartCase = 1
" Use Hatena.vim
let g:hatena_user='voidy21'
" Use git-vim
let g:git_no_map_default = 1
let g:git_command_edit = 'rightbelow vnew'
nnoremap <Leader>gd :<C-u>GitDiff --cached<CR>
nnoremap <Leader>gD :<C-u>GitDiff<CR>
nnoremap <Leader>gs :<C-u>GitStatus<CR>
nnoremap <Leader>gl :<C-u>GitLog<CR>
nnoremap <Leader>gL :<C-u>GitLog -u \| head -10000<CR>
nnoremap <Leader>ga :<C-u>GitAdd<CR>
nnoremap <Leader>gA :<C-u>GitAdd <cfile><CR>
nnoremap <Leader>gc :<C-u>GitCommit<CR>
nnoremap <Leader>gC :<C-u>GitCommit --amend<CR>
nnoremap <Leader>gp :<C-u>Git push 
autocmd FileType git-* nnoremap <buffer> q <C-w>c
