set hlsearch
set number
set scrolloff=1000
set laststatus=2
set tags=.tags
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
inoremap { {}<LEFT>
inoremap [ []<LEFT>
inoremap ( ()<LEFT>
inoremap " ""<LEFT>
inoremap ' ''<LEFT>
vnoremap { "zdi^V{<C-R>z}<ESC>
vnoremap [ "zdi^V[<C-R>z]<ESC>
vnoremap ( "zdi^V(<C-R>z)<ESC>
vnoremap " "zdi^V"<C-R>z^V"<ESC>
vnoremap ' "zdi'<C-R>z'<ESC>
" ポップアップメニューのカラーを設定
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

"" 全角スペースを視覚化
highlight ZenkakuSpace cterm=underline ctermfg=lightblue guibg=white
match ZenkakuSpace /　/

"" タブ幅
set expandtab
set shiftwidth=4
set softtabstop=4
set tabstop=4
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


let g:Align_xstrlen = 3
set viminfo+=!
:map <silent> <C-T> :call BufferList()<CR>


if has("autocmd")
      autocmd FileType python set complete+=k/home/yoshinoya/pydiction-0.5/pydiction iskeyword+=.,(
endif " has("autocmd")


