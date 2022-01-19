#!/usr/bin/env node
// index.ts
/**
 * Change Detector is a command-line tool designed to help you identify the components slowing down your Angular application.
 * 
 * Specify which Angular modules/components you want to run changedetector on and it will inject a few lines of code into 
 * the component's HTML and Typescript files (don't worry, you can easily remove the changes any time). The injected code 
 * will enable the component to increment a counter and log to your brower console everytime the component is re-rendered.
 * 
 * This will allow you to identify components which are being rendered more often than expected and potentially causing 
 * performance issues within your application.
 */
import { usage } from 'yargs';
import { access } from 'fs';
import { sync } from "glob";
import { ChangeDetector } from "./changedetector"; 

const options: any =
    usage(`A command-line tool designed to help you identify the components slowing down your Angular application.\n\nUsage: $0 -p <path> [options]`)
        .option("p", { alias: "path", describe: "Path to root directory of Angular project", type: "string", demandOption: true })
        .option("m", { alias: "module", describe: "Feature module to apply to", type: "string", demandOption: false })
        .option("c", { alias: "component", describe: "Component to apply to", type: "string", demandOption: false })
        .option("undo", { describe: "Remove changes added by Change Detector", type: "boolean", demandOption: false })
        .option("v", { alias: "verbose", describe: "Output any logging", type: "boolean", demandOption: false })
        .example('$0 -p ~/my-app -c home', 'Apply on component')
        .example('$0 -p ~/my-app -m dashboard', 'Apply on module')
        .example('$0 -p ~/my-app -c home -c navbar -m dashboard', 'Apply on mulitple components/modules')
        .example('$0 -p ~/my-app -c home -m dashboard --undo', 'Remove injected code from components')
        .argv;

const path = options.path;

// Check if given path is to an Angular project
access(`${path}/angular.json`, async (err: NodeJS.ErrnoException | null) => {
    if (err) {
        console.log("Not an Angular Directory");
        return;
    } else {
        // Use glob to get lists of all modules and components in the project.
        // These lists are used to search for project files without having to
        // traverse the filesystem everytime. Improves performance.
        const appModules: string[] = sync(`${path}/src/**/*module.ts`, { realpath: true });
        const appComponents: string[] = sync(`${path}/src/**/*component.ts`, { realpath: true });

        if (!options.module && !options.component) {
            console.log("\nPlease specify a component (-c) or feature module (-m)\n");
            return;
        }

        const changeDetector = new ChangeDetector(appModules, appComponents, !!options.verbose);

        if (options.module) {
            await changeDetector.addModule(options.module);
        }

        if (options.component) {
            await changeDetector.addComponent(options.component);
        }

        if (options.undo) {
            changeDetector.cleanComponents();
        } else {
            changeDetector.addCodeToComponents();
        }
    }
});
