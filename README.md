# Family Movie Filter

[![Build Status](https://travis-ci.org/cpdog/familymoviefilter.svg?branch=master)](https://travis-ci.org/cpdog/familymoviefilter)

### Todo items [Chrome Extension]

- ~~Add blur capability for editors~~
- ~~Add link to see closed captions~~
  - ~~It should highlight things that the auto editor would mute~~
  - It should highlight things that the current filters have added
  - ~~It should allow you to jump exactly to that spot in the movie~~
- [Bug] ~~Right now ALL filters are applied regardless of whether you have enabled that category or not~~
- ~~Add ability to toggle filters on/off~~
- Add ability to define new filters and send to the API
- Add timeline
  - Allow you to visually see list of filters
  - Allow you to use this timeline to zoom in and get more precise scrubbing to create new filters
 - ~~Add ability to slow down video~~
 - ~~Add ability to go frame by frame~~ (tricky in Netflix)
 - Currently filters are shown by time, probably makes sense to show in tree mode by category, then by high low: like this:
 
 <blockquote>
 [ x ] Violence (10)
 <blockquote>
  [ x ] High (5)
   
   1. Something
   2. Something
   3. Something
   4. Something
   5. Something
 </blockquote>
 <blockquote>
  [ x ] Low (5)
    
    1. Something
    2. Something
    3. Something
    4. Something
    5. Something
  </blockquote>
 </blockquote>
  at this point you could toggle at any level in the tre. 
 
 - Right now if you have closed captions on, the filter will filter out the entire phrase. 
 However, if a user adds a dialog filter, it really shouldn't mute the entire line. It probably
   should still put (CENSOR) on the offending word/phrase
