# Sample Language Server

### Installing

```
npm install -g sample-server
```


### Running the Language server

```
sample-server --studio
```



## Editor Extension Support

* [x] Visual Studio Code
* [ ] Atom
* [ ] Sublime Text
* [ ] Vim/NeoVim
* [ ] Emacs

### Visual Studio Code

Sample Server for VS Code is available [here]()


### Atom IDE



### Sublime Text

[LSP](https://github.com/tomv564/LSP) (untested)

```json
"samplesvr": {
    "command": [
        "sample-server",
        "--studio",
    ],
    "enabled": true,
    "languageId": "python"
}
```

### vim and neovim

1. Install `sample-server`
2. Install [LanguageClient-neovim](https://github.com/autozimu/LanguageClient-neovim/blob/next/INSTALL.md)
3. Add the following to neovim's configuration (the case if you want to use for python and javascript)

```vim
let g:LanguageClient_serverCommands = {
    \ 'python': ['sample-server', '--stdio'],
    \ 'javascript': ['sample-server', '--stdio'],
    \ }
```

### Emacs

[lsp-mode](https://github.com/emacs-lsp/lsp-mode) (untested)
