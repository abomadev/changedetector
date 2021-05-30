#!/usr/bin/env node
import { eachLine } from 'line-reader';
import { replaceInFile } from 'replace-in-file';
import { usage, option } from 'yargs';
import { promise, EntryInfo } from 'readdirp';
import { access, appendFile, writeFile } from 'fs';
const lineByLine = require('n-readlines');

const cdFunctionName = "__changeDectector__()"
const cdCallCounter = "\tprivate __changeDetectorCounter__ = 0"
const cdHtmlTag = `<label id=\"__changeDetector__\" hidden>{{ ${cdFunctionName} }}</label>`


class ChangeDetector {
    private _verbose = false;
    private _workingComponents: Array<EntryInfo> = []

    constructor(verbose: boolean) {
        this._verbose = verbose;
    }

    get verbose() {
        return this._verbose
    }

    async addModule(moduleName: string) {
        let mod: any = await this.findFile(path, `${moduleName}.module.ts`)
        let modComponents = await this.extractComponentsFromModule(mod.fullPath)
        this._workingComponents.push(...modComponents)
    }

    async addComponent(componentName: string) {
        const component: EntryInfo = await this.findFile(path, `${componentName}.component.ts`)
        this._workingComponents.push(component)
    }

    async extractComponentsFromModule(modulePath: string) {
        const lineReader = new lineByLine(modulePath);
        let lineObj;
        let line;
        const components: Array<EntryInfo> = []

        while (lineObj = lineReader.next()) {
            line = lineObj.toString('ascii')
            if (line.includes("import") && line.includes("from") && line.includes(".component")) {
                const imprtArr = line.split('/')

                const componentName = `${imprtArr[imprtArr.length - 1].replace(/[^a-zA-Z\-\.]/g, "")}.ts`
                const fileInfo: EntryInfo = await this.findFile(path, componentName)
                components.push(fileInfo)
            }
        }
        return components;
    }

    async findFile(path: string, filter: string): Promise<EntryInfo> {
        return await this.getFilesList(path, filter)
            .then(files => files[0])
            .catch(err => {
                throw new Error(err)
            })
    }

    async getFilesList(path: string, filter: string): Promise<Array<EntryInfo>> {
        return await promise(path, { fileFilter: filter });
    }

    addCodeToComponents() {
        if (this.verbose) console.log("Adding change detector code to:")

        this._workingComponents.forEach(file => {
            if (this.verbose) console.log(file.basename.replace(".ts",""))
            this.addCode(file.fullPath, file.basename)
        })
    }

    cleanComponents() {
        if (this.verbose) console.log("Removing change detector code from:")
        
        this._workingComponents.forEach(file => {
            if (this.verbose) console.log(file.basename.replace(".ts",""))
            this.clean(file.fullPath)
        })
    }

    addCode(tsFullPath: string, basename: string) {
        const htmlFullPath = tsFullPath.replace(".ts", ".html")
        this.addCodeToHtmlFile(htmlFullPath)
        this.addCodeToTSFile(tsFullPath, basename)
    }

    clean(tsFullPath: string) {
        const htmlFullPath = tsFullPath.replace(".ts", ".html")
        this.cleanHtmlFile(htmlFullPath)
        this.cleanTSFile(tsFullPath)
    }

    async addCodeToHtmlFile(fullPath: string) {
        return await appendFile(fullPath, `${cdHtmlTag}`, (err) => {
            if (err) throw err;
        });
    }

    addCodeToTSFile(fullPath: string, basename: string) {
        let original: string = ""
        let origWithChanges: string = ""
        const startKey = "export class";
        const componentName = this.toTitleCase(basename.split(".")[0])

        eachLine(fullPath, (line: string) => {
            if (line.includes(startKey) || original) {
                original += line + "\n"
                origWithChanges += origWithChanges ? line + "\n" : line + "\n" + cdCallCounter + "\n"
                if (this.isBalanced(original)) {
                    origWithChanges = origWithChanges.replace(/\}\n$/, `${this.generateCDFunction(componentName)}\n}\n`)
                    this.findAndReplace(fullPath, original, origWithChanges)
                    return false;
                }
            }
        });
    }

    cleanHtmlFile(fullPath: string) {
        let original = ""
        let cleaned = ""
        let lineObj;
        let line;

        const lineReader = new lineByLine(fullPath);
        while (lineObj = lineReader.next()) {
            line = lineObj.toString('ascii')
            original += line + "\n"

            cleaned += line.includes(cdHtmlTag) ? line.replace(cdHtmlTag, "") : line + "\n"
        }
        writeFile(fullPath, cleaned, 'utf8', (err) => {
            if (err) return console.log(err);
        });
    }

    cleanTSFile(fullPath: string) {
        let original = ""
        let cleaned = ""
        let tmp_fn = ""
        let keyFound = false;
        let keyInLine = false;

        const lineReader = new lineByLine(fullPath);

        let lineObj;
        let line: string

        while (lineObj = lineReader.next()) {
            line = lineObj.toString('ascii')
            original += line + "\n"
            keyInLine = line.includes(cdFunctionName);

            if (keyInLine) { keyFound = true; }

            if (!line.includes(cdCallCounter) && !keyFound && !keyInLine) {
                cleaned += line + "\n"
            } else {
                if (keyFound || keyInLine) {
                    tmp_fn += line + "\n"
                    if (this.isBalanced(tmp_fn)) {
                        this.findAndReplace(fullPath, original, cleaned)
                        break;
                    }
                }
            }
        }
    }

    toTitleCase(str: string) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    isBalanced(str: string) {
        return Array.from(str).reduce((uptoPrevChar, thisChar) => {
            ((thisChar === '{' && uptoPrevChar++ || thisChar === '}' && uptoPrevChar--));
            return uptoPrevChar;
        }, 0) === 0
    }

    async findAndReplace(filename: string, findStr: string, changeTo: string) {
        const options = {
            files: filename,
            from: findStr,
            to: changeTo,
        };
        try {
            const result = await replaceInFile(options)
        }
        catch (error) {
            console.error('Error occurred:', error);
        }
    }

    generateCDFunction(name: string) {
        return `\t${cdFunctionName} {\n\t\tconsole.log(\"[ ${name} component ] Change detection called\", this.__changeDetectorCounter__)\n\t\tthis.__changeDetectorCounter__++\n\t}`
    }
}



const options: any =
    usage("Usage: -p <path>")
        .option("p", { alias: "path", describe: "Path to root directory of Angular project", type: "string", demandOption: true })
        .option("m", { alias: "module", describe: "Feature module to apply to", type: "string", demandOption: false })
        .option("c", { alias: "component", describe: "Single component to apply", type: "string", demandOption: false })
        .option("undo", { describe: "Remove changes added by Change Detector", type: "boolean", demandOption: false })
        .option("v", { alias: "verbose", describe: "Output any logging", type: "boolean", demandOption: false })
        .argv;


const path = options.path

// console.log({ options })
// console.log(typeof options.c)
access(`${path}/angular.json`, async (err) => {
    if (!!err) {
        console.log("Not an Angular Directory");
        return
    } else {
        const changeDetector = new ChangeDetector(!!options.verbose)
        if (options.module) {
            // Need to handle the case of multiple 
            await changeDetector.addModule(options.module)
        }

        if (options.component) {
            await changeDetector.addComponent(options.component)
        }

        if (options.undo) {
            changeDetector.cleanComponents()
        } else {
            changeDetector.addCodeToComponents()
        }

    }
});


