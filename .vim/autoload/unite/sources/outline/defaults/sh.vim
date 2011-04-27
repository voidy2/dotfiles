"=============================================================================
" File    : autoload/unite/sources/outline/defaults/sh.vim
" Author  : h1mesuke <himesuke@gmail.com>
" Updated : 2011-04-19
"
" Licensed under the MIT license:
" http://www.opensource.org/licenses/mit-license.php
"
"=============================================================================

" Default outline info for Shell Scripts
" Version: 0.0.8

function! unite#sources#outline#defaults#sh#outline_info()
  return s:outline_info
endfunction

let s:util = unite#sources#outline#import('util')

let s:outline_info = {
      \ 'heading-1': s:util.shared_pattern('sh', 'heading-1'),
      \ 'heading'  : '^\s*\%(\w\+()\|function\>\)',
      \ 'skip': {
      \   'header': s:util.shared_pattern('sh', 'header'),
      \ },
      \}

function! s:outline_info.create_heading(which, heading_line, matched_line, context)
  let heading = {
        \ 'word' : a:heading_line,
        \ 'level': 0,
        \ 'type' : 'generic',
        \ }

  if a:which ==# 'heading-1' && a:heading_line =~ '^\s*#'
    let m_lnum = a:context.matched_lnum
    let heading.type = 'comment'
    let heading.level = s:util.get_comment_heading_level(a:context, m_lnum, 5)
  elseif a:which ==# 'heading'
    let heading.level = 4
    let heading.type = 'function'
    let heading.word = substitute(heading.word, '\s*{.*$', '', '')
  endif

  if heading.level > 0
    return heading
  else
    return {}
  endif
endfunction

" vim: filetype=vim
