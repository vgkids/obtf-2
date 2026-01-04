---
layout: page
title: About
permalink: /about/
---

OBTF-2 was written by [James Marks](https://www.linkedin.com/in/jameslmarks/) as part of an annual investment in taking better notes. It's written using [Tauri](https://tauri.app), [Rust](https://rust-lang.org), and [VueJs](https://vuejs.org). This site is built with [Jekyll](https://jekyllrb.com).

Download links:

[Download for MacOS (Apple Silicon)]({{ site.baseurl }}assets/downloads/obtf-2.zip)

Note: If you get an error about the download being corrupted, it's because I haven't paid Apple for a  Developer License recently. You can verify the build by hand like so:

```
xattr -cr /path/to/the-app
```

For example,
```
xattr -cr /Users/your-username/Applications/obtf-2.app
 ```