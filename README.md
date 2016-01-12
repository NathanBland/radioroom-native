## RadioRoom
##### Radio room native client

Eventually there will be prebuilt binaries here.

## Install Instructions
Due to the build binaries being gigantic at the moment, they aren't going to be
hosted on github. So here is how you install RR on your system (yay!)

1. `git clone https://github.com/NathanBland/radioroom-native.git`
2. `cd radioroom-native`
3. `npm install -g gulp && npm install`
4. `gulp run`

If you want a nice little platform specific binary to use instead of running
gulp each time. Use one of these commands:

`gulp win` `gulp linux` `gulp osx`

That will generate a folder for you under the `build` directory.
Move that to wherever you want and enjoy.
