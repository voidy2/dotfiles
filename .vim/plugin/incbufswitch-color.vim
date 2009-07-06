"============================================================================
"        File: incbufswitch.vim
" Description: Switch the buffer in the current window by incrementally typing
"              the name.
"      Author: Michael Denio (mike at imagine-sw.com)
"     Version: 1.1
"
"       Usage: (1) Define a normal key mapping to :IncBufSwitch or leave the
"                  default of <C-S>
"              (2) In normal mode, start typing the name of the buffer you want
"                  to switch to.
"              (3) Press <BS> if make an error
"              (4) Press <TAB> to find the next matching buffer
"              (5) Press either <CR> or <ESC> when you are done
"
" $Id: incbufswitch.vim,v 1.6 2003/06/24 13:13:39 mike Exp $
" 
"     History:
"     
" 2003/06/24 mjd Have <ESC> return user to originating buffer
" 2003/06/23 mjd Added <TAB> command to find next matching buffer
" 2003/06/18 mjd Created
"
"============================================================================


" Install command and default key mapping
if !exists(":IncBufSwitch")
  command IncBufSwitch :call <SID>IncBufferSwitch()
endif

if !hasmapto("<Plug>IncBufferSwitch")
    nmap <silent> <unique> <C-S> :IncBufSwitch<CR>
endif

hi link IncBufSwitchCurrent  IncSearch
hi link IncBufSwitch         Search


"
" Switch to a buffer that matches the partial name we have thus far
" 
function! <SID>PartialBufSwitch(partialName, first)
    let lastBuffer = bufnr("$")
    let s:buflist = ''
    let flag = 0
    let i = 1
    while i <= lastBuffer
        if (bufexists(i) != 0 && buflisted(i))
            let filename = expand("#" . i . ":t")
            "if (match(filename, "^" . a:partialName) > -1)
            if (match(filename, a:partialName) > -1)
               if flag == s:tabStop
                  if a:first == 0
                     execute "silent buffer " i
                     redraw
                  endif
               endif
               let s:buflist = s:buflist .','. expand("#" . i . ":t")
               let flag = flag + 1
            endif
        endif
        let i = i + 1
    endwhile

    let s:buflist = substitute(s:buflist, '^,', '', '')
    if flag == s:tabStop + 1
        let s:tabStop = - 1
    endif
endfunction

function! ShowBuflist(partialName, buflist)
    echon " {"
    let lastBuffer = bufnr("$")
    let flag = 0
    let i = 1
    while i <= lastBuffer
        if (bufexists(i) != 0 && buflisted(i))
            let filename = expand("#" . i . ":t")
            "if (match(filename, "^" . a:partialName) > -1)
            if (a:partialName != "" && match(filename, a:partialName) > -1)
               if (bufnr("%") == i)
                echohl IncBufSwitchCurrent
               else 
                echohl IncBufSwitch
               endif
               echon filename
               echohl None
               let flag = flag + 1
             else
               echon filename
            endif
            if (i != lastBuffer)
              echon ","
            endif
        endif
        let i = i + 1
    endwhile
    echon " }"
endfunction

"
" Perform an incremental buffer switch
"
function! <SID>IncBufferSwitch()
    let origBufNr = bufnr("%")
    let partialBufName = ""
    let s:tabStop = 0

    call s:PartialBufSwitch('', 1)
    echon "IncBufSwitch: "
    "echon ' {'.s:buflist.'}'
    call ShowBuflist(partialBufName, s:buflist)

    while 1 == 1
        let flag  =0
        let rawChar = getchar()
        if rawChar == 13
            break
        endif
        if rawChar == 27 " <ESC>
            echon "\r                    "
            " return to original buffer if not already on it
            if bufnr("%") != origBufNr
                execute "silent buffer " origBufNr
            endif
            break
        endif
        if rawChar == "\<BS>"
             let s:tabStop = 0
             if strlen(partialBufName) > 0
                let partialBufName = strpart(partialBufName, 0, strlen(partialBufName) - 1)
                if strlen(partialBufName) == 0
                   let flag = 1
                   if bufnr("%") != origBufNr
                      execute "silent buffer " origBufNr
                   endif
                endif
             else
                if bufnr("%") != origBufNr
                   execute "silent buffer " origBufNr
                endif
                break
             endif
        elseif rawChar == 9 " TAB -- find next matching buffer
            let s:tabStop = (s:tabStop == -1) ? 0 : s:tabStop + 1
        else
            let nextChar = nr2char(rawChar)
            let partialBufName = partialBufName . nextChar
        endif

        call s:PartialBufSwitch(partialBufName, flag)
        redraw
        echon "\rIncBufSwitch: " . partialBufName
        "echon ' {'.s:buflist.'}'
        call ShowBuflist(partialBufName, s:buflist)
    endwhile
endfunction
