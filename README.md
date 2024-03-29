# Change Detector

Change Detector is a command-line tool designed to help you identify the components slowing down your Angular application.

## Install
Install globally (recommended):
```
npm install -g ng-changedetector
```

Or as a dev dependency:

```
npm install ng-changedetector --save-dev
```


## How does it work?

Specify which Angular modules/components you want to run `changedetector` on and it will inject a few lines of code into the component's HTML and Typescript files (don't worry, you can [easily remove](#clean-up) the changes any time). The injected code will enable the component to increment a counter and log to your brower console everytime the component is re-rendered.

This will allow you to identify components which are being rendered more often than expected and potentially causing performance issues within your application.

Next, apply performance optimizations to those troublesome components. Unfortunately, that part is up to you. But a good place to start is by implementing the OnPush change detection strategy on that component. 

Once you're done, you can simply [remove the code](#clean-up) injected by `changedetector`.



>If you need more optimization techniques, [@mgechev](https://twitter.com/mgechev) compiled an awesome checklist on Angular Performance which you can find [here](https://github.com/mgechev/angular-performance-checklist).

## Usage

You can get a full description of Change Detector's usage by running:
```
changedetector --help
```

> **NOTE:**
> Change Detector is designed to clean up the few lines of code it inserts in order to leave your code the way it found it but while not necessary -- it is recommended that the projects you use this on are version controlled for peace of mind.

### Quick Start
```
changedetector -p /path/to/project -c <component> -m <module>
```

In this example, lets apply `changedetector` on the `home` component and `dashboard` feature module of an Angular project called `my-app`:

```
changedetector -p ~/projects/my-app -c home -m dashboard
```

This will inject a few lines of code into those components which will
cause the component to log to console everytime they are re-rendered.

### Clean up

To remove the inserted code, simply add `--undo`.

_Eg. Removing from the `home` component and `dashboard` feature module._
```
changedetector -p ~/projects/my-app -c home -m dashboard --undo
```

### More Examples
**1. _Apply `changedetector` on component_**
```
changedetector -p ~/projects/my-app -c home 
```
**2. _Apply `changedetector` on feature module_**
```
changedetector -p ~/projects/my-app -m dashboard
```
**3. _Apply `changedetector` on component and feature module_**
```
changedetector -p ~/projects/my-app -c home -m dashboard 
```
**4. _Apply `changedetector` on mulitple components_**
```
changedetector -p ~/projects/my-app -c home -c contact 
```