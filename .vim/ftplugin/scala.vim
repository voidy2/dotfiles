if !exists('did_import_mapping') && !exists('g:codefellow_no_import_mapping')
  let did_import_mapping = 1
  noremap \i :call<space>codefellow_add_import#AddImportFromQuickfix()<cr>
  command ImportClasses call codefellow_add_import#AddImportFromQuickfix()
  setlocal completeopt=preview,menu,menuone
endif
