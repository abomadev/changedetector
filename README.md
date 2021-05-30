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

Specify which Angular modules/components you want to run `changedetector` on and it will inject a few lines of code into the component's HTML and Typescript files. The injected code will cause the component to log to console everytime the component is re-rendered and incrementing a counter.

This will allow you to identify components which are being rendered more often than they should and potentially causing performance issues within your application.

Adding performance optimisations on those components, such as implementing the OnPush change detection strategy, will improve your applications performance and overal user experience. 


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