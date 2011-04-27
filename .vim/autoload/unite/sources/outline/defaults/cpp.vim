"=============================================================================
" File    : autoload/unite/sources/outline/defaults/cpp.vim
" Author  : h1mesuke <himesuke@gmail.com>
" Updated : 2011-04-23
"
" Licensed under the MIT license:
" http://www.opensource.org/licenses/mit-license.php
"
"=============================================================================

" Default outline info for C++
" Version: 0.1.5

function! unite#sources#outline#defaults#cpp#outline_info()
  return s:outline_info
endfunction

let s:util = unite#sources#outline#import('util')

let s:outline_info = {
      \ 'heading_groups': [
      \   ['macro'],
      \   ['namespace'],
      \   ['class', 'enum', 'struct', 'typedef'],
      \   ['function'],
      \ ],
      \ 'not_match_patterns': [
      \   s:util.shared_pattern('*', 'parameter_list'),
      \ ],
      \}

function! s:outline_info.extract_headings(context)
  let ctags = unite#sources#outline#import('ctags')
  return ctags.extract_headings(a:context)
endfunction

function! s:outline_info.get_heading_group(heading)
  let group_of = self.heading_group_map
  let group = get(group_of, a:heading.type, 0)
  if group == group_of.macro
    if matchstr(a:heading.word, '^\zs\h\w*\ze') =~# '\l'
      return group_of.function
    endif
  endif
  return group
endfunction

" vim: filetype=vim
