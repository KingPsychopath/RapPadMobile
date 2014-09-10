# RapPad Mobile

### Getting started

RapPad Mobile is the official mobile app for [RapPad](www.rappad.co). You can download it on the Google Play or iTunes. 

The app is disguised as a website that uses JS, CSS, and HTML. Under the hood it is powered by PhoneGap. 

Below is a guide on getting it on your computer, running it, and making contributions.

1. Fork the repo. Make sure you have all prerequisites installed.
2. `cd` into the root directory.
3. Run `sass --watch www/sass/:www/css --style expanded` to build CSS stylesheets from SASS files.
4. `ruby -r webrick -e "s = WEBrick::HTTPServer.new(:Port => 8000, :DocumentRoot => Dir.pwd); trap('INT') { s.shutdown }; s.start"` to serve the website locally so you can test in the browser.
5. `cordova emulate (ios|android)` to test on a platform (ios or android). 
