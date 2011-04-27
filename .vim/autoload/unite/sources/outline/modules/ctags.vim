"=============================================================================
" File    : autoload/unite/source/outline/lib/ctags.vim
" Author  : h1mesuke <himesuke@gmail.com>
" Updated : 2011-04-19
" Version : 0.3.4
" License : MIT license {{{
"
"   Permission is hereby granted, free of charge, to any person obtaining
"   a copy of this software and associated documentation files (the
"   "Software"), to deal in the Software without restriction, including
"   without limitation the rights to use, copy, modify, merge, publish,
"   distribute, sublicense, and/or sell copies of the Software, and to
"   permit persons to whom the Software is furnished to do so, subject to
"   the following conditions:
"   
"   The above copyright notice and this permission notice shall be included
"   in all copies or substantial portions of the Software.
"   
"   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
"   OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
"   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
"   IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
"   CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
"   TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
"   SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
" }}}
"=============================================================================

function! unite#sources#outline#modules#ctags#module()
  return s:ctags
endfunction

"-----------------------------------------------------------------------------

let s:tree = unite#sources#outline#import('tree')
let s:util = unite#sources#outline#import('util')

function! s:get_SID()
  return str2nr(matchstr(expand('<sfile>'), '<SNR>\zs\d\+\ze_'))
endfunction

let s:ctags = unite#sources#outline#modules#base#new(s:get_SID(), 'Ctags')
delfunction s:get_SID

function! s:find_exuberant_ctags()
  let ctags_bin_names = [
        \ 'ctags-exuberant',
        \ 'exctags',
        \ 'ctags',
        \ 'tags',
        \ ]
  if exists('g:neocomplcache_ctags_program')
    let ctags_bin_names = [g:neocomplcache_ctags_program] + ctags_bin_names
  endif
  for ctags in ctags_bin_names
    if executable(ctags)
      let ctags_out = unite#util#system(ctags . ' --version')
      if split(ctags_out, "\<NL>")[0] =~? '\<Exuberant Ctags\>'
        return ctags
      endif
    endif
  endfor
  return ''
endfunction 

let s:ctags.bin = s:find_exuberant_ctags()
let s:ctags.langs = {}

" C/C++
"
"  [c] classes
"  [d] macro definitions
"   e  enumerators (values inside an enumeration)
"  [f] function definitions
"  [g] enumeration names
"   l  local variables
"   m  class, struct, and union members
"  [n] namespaces
"   p  function prototypes
"  [s] structure names
"  [t] typedefs
"  [u] union names
"   v  variable definitions
"   x  external and forward variable declarations
"
let s:ctags.langs.cpp = {
      \ 'name': 'C++',
      \ 'ctags_options': ' --c++-kinds=cdfgnstu ',
      \ 'scope_kinds'  : ['namespace', 'class', 'struct'],
      \ 'scope_delim'  : '::',
      \ }
function! s:ctags.langs.cpp.create_heading(tag, context)
  let line = a:context.lines[a:tag.lnum]
  let heading = {
        \ 'word' : a:tag.name,
        \ 'type' : a:tag.kind,
        \ 'lnum' : a:tag.lnum,
        \ }
  let ignore = 0
  if heading.type ==# 'function'
    if a:tag.name =~# '^[[:upper:]_]\{3,}$'
      let ignore = 1
    elseif has_key(a:tag, 'signature')
      let heading.word .= ' ' . a:tag.signature
    else
      let heading.word .= ' ' . s:get_param_list(a:context, a:tag.lnum)
    endif
  else
    if heading.type ==# 'macro'
      if line =~# '#undef\>'
        let ignore = 1
      elseif line =~# a:tag.name . '('
        let heading.word .= ' ' . s:get_param_list(a:context, a:tag.lnum)
      endif
    endif
    let heading.word .= ' : ' . a:tag.kind
  endif
  if has_key(a:tag, 'implementation')
    let heading.word .= ' <' . a:tag.implementation . '>'
  endif
  return ignore ? {} : heading
endfunction

let s:ctags.langs.c = copy(s:ctags.langs.cpp)
call extend(s:ctags.langs.c, { 'name': 'C', 'ctags_options': ' --c-kinds=cdfgnstu ' }, 'force')

" Java
"
"  [c] classes
"   e  enum constants
"   f  fields
"  [g] enum types
"  [i] interfaces
"   l  local variables
"  [m] methods
"  [p] packages
"
let s:ctags.langs.java = {
      \ 'name': 'Java',
      \ 'ctags_options': ' --java-kinds=cgimp ',
      \ 'scope_kinds'  : ['interface', 'class'],
      \ 'scope_delim'  : '.',
      \ }

" Python
"
"  [c] classes
"  [f] functions
"  [m] class members
"   v  variables
"   i  imports
"
let s:ctags.langs.python = {
      \ 'name': 'Python',
      \ 'ctags_options': ' --python-kinds=cfm ',
      \ 'scope_kinds'  : ['function', 'class', 'member'],
      \ 'scope_delim'  : '.',
      \ }
function! s:ctags.langs.python.create_heading(tag, context)
  let heading = {
        \ 'word' : a:tag.name,
        \ 'type' : a:tag.kind,
        \ 'lnum' : a:tag.lnum,
        \ }
  let ignore = 0
  if heading.type =~# '^\%(function\|member\)'
    let heading.word .= ' ' . s:get_param_list(a:context, a:tag.lnum)
  elseif heading.type ==# 'variable'
    " NOTE: ctags always generates tags for variables.
    let ignore = 1
  else
    let heading.word .= ' : ' . a:tag.kind
  endif
  return ignore ? {} : heading
endfunction

"-----------------------------------------------------------------------------

function! s:Ctags_exists()
  return !empty(s:ctags.bin)
endfunction
call s:ctags.bind('exists')

function! s:Ctags_has(filetype)
  if !has_key(s:ctags.langs, a:filetype)
    return 0
  else
    let lang = s:ctags.langs[a:filetype]
    let ctags_out = unite#util#system(s:ctags.bin . ' --list-languages')
    return index(split(ctags_out, "\<NL>"), lang.name, 1) >= 0
  endif
endfunction
call s:ctags.bind('has')

function! s:get_tags(context)
  let lang = s:ctags.langs[a:context.buffer.major_filetype]
  let path = a:context.buffer.path

  let opts  = ' -f - --excmd=number --fields=afiKmsSzt --sort=no '
  let opts .= ' --language-force=' . lang.name
  let opts .= lang.ctags_options

  let path = s:util.path.normalize(path, 'shell')

  let ctags_out = unite#util#system(s:ctags.bin . opts . path)
  let status = unite#util#get_last_status()

  if status
    call unite#util#print_error(
          \ "unite-outline: ctags failed with status " . status . ".")
    return []
  else
    let tag_lines = split(ctags_out, "\<NL>")
    try
      return map(tag_lines, 's:create_tag(v:val, lang)')
    catch
      throw tag_lines[0]
    endtry
  endif
endfunction

" TAG FILE FORMAT:
"
"   tag_line
"     := tag_name<Tab>file_name<Tab>ex_cmd;"<Tab>{extension_fields}
"
"   extension_fields
"     := key:value<Tab>key:value<Tab>...
"
function! s:create_tag(tag_line, lang)
  let fields = split(a:tag_line, "\<Tab>")
  let tag = {}
  let tag.name = fields[0]
  let tag.lnum = str2nr(fields[2])
  for ext_fld in fields[3:-1]
    let [key, value] = matchlist(ext_fld, '^\([^:]\+\):\(.*\)$')[1:2]
    let tag[key] = value
  endfor

  for scope_kind in a:lang.scope_kinds
    if has_key(tag, scope_kind)
      let tag.scope_kind = scope_kind
      let tag.scope = tag[scope_kind]
    endif
  endfor

  if has_key(tag, 'scope')
    let tag.qualified_name = tag.scope . a:lang.scope_delim . tag.name
  else
    let tag.qualified_name = tag.name
  endif

  return tag
endfunction

function! s:Ctags_extract_headings(context)
  if !s:Ctags_exists()
    call unite#util#print_error("unite-outline: Sorry, Exuberant Ctags required.")
    return []
  elseif !s:Ctags_has(a:context.buffer.filetype)
    call unite#util#print_error(
          \ "unite-outline: Sorry, your ctags doesn't support " .
          \ toupper(a:context.buffer.filetype))
    return []
  endif

  let lang = s:ctags.langs[a:context.buffer.filetype]
  let scope_kinds_pattern = '^\%(' . join(lang.scope_kinds, '\|') . '\)$'

  let tags = s:get_tags(a:context)
  let num_tags = len(tags)

  let tree_root = {} | let scope_table = {}
  let tag_name_counter = {}

  let idx = 0
  while idx < num_tags
    let tag = tags[idx]

    if has_key(lang, 'create_heading')
      let heading = lang.create_heading(tag, a:context)
    else
      let heading = s:create_heading(tag, a:context)
    endif
    if empty(heading) | let idx += 1 | continue | endif

    let heading.word = substitute(substitute(heading.word, '(\s*', '(', ''), '\s*)', ')', '')
    let heading.word .= s:get_tag_name_id_suffix(tag, tag_name_counter)

    if tag.kind =~# scope_kinds_pattern
      " the heading has its scope
      if !has_key(scope_table, tag.name)
        let scope_table[tag.qualified_name] = heading
      elseif has_key(scope_table[tag.qualified_name], 'source__pseudo__')
        let heading.children = scope_table[tag.qualified_name].children
        let scope_table[tag.qualified_name] = heading
      endif
    endif

    if has_key(tag, 'scope')
      " the heading belongs to a scope
      if !has_key(scope_table, tag.scope)
        let pseudo_heading = {
              \ 'word' : '(' . tag.scope . ') : ' . tag.scope_kind,
              \ 'level': 1,
              \ 'type' : tag.scope_kind,
              \ 'lnum' : tag.lnum,
              \ 'source__pseudo__': 1,
              \ }
        let scope_table[tag.scope] = pseudo_heading
      endif
      let heading.word = s:get_tag_access_mark(tag) . heading.word
      call s:tree.append_child(scope_table[tag.scope], heading)

    elseif !has_key(scope_table, tag.qualified_name)
      " the heading belongs to the toplevel (and doesn't have its scope)
      call s:tree.append_child(tree_root, heading)
    endif

    if idx % 50 == 0
      call s:util.print_progress("Extracting headings..." . idx * 100 / num_tags . "%")
    endif

    let idx += 1
  endwhile
  call s:util.print_progress("Extracting headings...done.")

  " merge
  for heading in filter(values(scope_table), 's:tree.is_toplevel(v:val)')
    call s:tree.append_child(tree_root, heading)
  endfor
  call s:util.list.sort_by_lnum(s:tree.get_children(tree_root))

  return tree_root
endfunction
call s:ctags.bind('extract_headings')

function! s:create_heading(tag, context)
  let line = a:context.lines[a:tag.lnum]
  let heading = {
        \ 'word' : a:tag.name,
        \ 'type' : a:tag.kind,
        \ "lnum" : a:tag.lnum,
        \ }
  if has_key(a:tag, 'signature')
    let heading.word .= ' ' . a:tag.signature
  else
    let heading.word .= ' : ' . a:tag.kind
  endif
  if has_key(a:tag, 'implementation')
    let heading.word .= ' <' . a:tag.implementation . '>'
  endif
  return heading
endfunction

function! s:get_param_list(context, lnum)
  let line = s:util.join_to_rparen(a:context, a:lnum)
  return matchstr(line, '([^)]*)')
endfunction

let s:OOP_ACCESS_MARKS = {
      \ 'public'   : '+',
      \ 'protected': '#',
      \ 'private'  : '-'
      \ }
function! s:get_tag_access_mark(tag)
  let access = has_key(a:tag, 'access') ? a:tag.access : 'unknown'
  return get(s:OOP_ACCESS_MARKS, access, '_') . ' '
endfunction

function! s:get_tag_name_id_suffix(tag, counter)
  let name = a:tag.qualified_name
  if has_key(a:tag, 'signature') | let name .= a:tag.signature | endif

  if has_key(a:counter, name)
    let a:counter[name] += 1
    return ' #' . a:counter[name]
  else
    let a:counter[name] = 1
    return ''
  endif
endfunction

" vim: filetype=vim
