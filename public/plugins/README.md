## krpano自定义插件压缩
- `Online Google Closure Compiler`: http://closure-compiler.appspot.com/home
- `Online YUI Compressor`: https://refresh-sf.com/yui/
- `krpano Encrypt Tool`: https://krpano.com/docu/tools/#encrypt

    ```
    找到krpanotools所在文件夹把它拖入终端,并按下方格式依次输入
     krpanotools encrypt [OPTIONS] inputfiles
     Inputfiles:
        Any files (placeholder * allowed).
        Supported file formats: xml, js, json, stl, depth, txt.
        By default a .encrypted postfix will be added to the filename.
    Options:
        -p
        Use a 'public' encryption key.
        Everyone will be able to load the encrypted files.
        -ow
        Overwrite the original input file.
        -bk
        Overwrite the original input file, but make a backup before.
        -in=### and -out=###
        Manually set the input and output filename.
        When using stdout as output filename, the encrypted filedata will be written to the console.
        -q
        Quiet mode, no console output.
    ```