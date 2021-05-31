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

    async addModule(module: string | Array<string>) {
        const modules: Array<string> = typeof module === 'string' ? [module] : module;
        for (const moduleName of modules) {
            try {
                const moduleInfo: any = await this.findFile(path, `${moduleName}.module.ts`)
                const moduleComponents = await this.extractComponentsFromModule(moduleInfo)
                this._workingComponents.push(...moduleComponents)
            } catch (error) {
                console.error(error)
            }
        }
    }

    async addComponent(component: string | Array<string>) {
        const components: Array<string> = typeof component === 'string' ? [component] : component;
        for (const componentName of components) {
            try {
                const componentInfo: EntryInfo = await this.findFile(path, `${componentName}.component.ts`)
                this._workingComponents.push(componentInfo)
            } catch (error) {
                console.error(error)
            }
        }
    }

    async extractComponentsFromModule(moduleInfo: EntryInfo) {
        const lineReader = new lineByLine(moduleInfo.fullPath);
        let lineObj;
        let line;
        const components: Array<EntryInfo> = []

        if (this.verbose) console.log(`\nLocating components imported by ${moduleInfo.basename}:`)

        while (lineObj = lineReader.next()) {
            line = lineObj.toString('ascii')
            if (line.includes("import") && line.includes("from") && line.includes(".component")) {
                const imprtArr = line.split('/')

                const componentName = `${imprtArr[imprtArr.length - 1].replace(/[^a-zA-Z\-\.]/g, "")}.ts`
                const fileInfo: EntryInfo = await this.findFile(path, componentName)
                
                if (this.verbose) console.log(" *",fileInfo.basename.replace(".ts", ""))
                components.push(fileInfo)
            }
        }
        return components;
    }

    async findFile(path: string, filter: string): Promise<EntryInfo> {
        return await this.getFilesList(path, filter)
            .then(files => {
                if (files.length === 0){ 
                    throw new Error(`File ${filter} not found`)
                }
                return files[0]
            })
            .catch(err => {
                throw err
            })
    }

    async getFilesList(path: string, filter: string): Promise<Array<EntryInfo>> {
        return await promise(path, { fileFilter: filter });
    }

    addCodeToComponents() {
        this.removeDuplicateComponentsInList()
        console.log("\nAdding change detector code to:")

        this._workingComponents.forEach(file => {
            console.log(" -",file.basename.replace(".ts", ""))
            this.addCode(file.fullPath, file.basename)
        })
    }

    cleanComponents() {
        this.removeDuplicateComponentsInList()

        console.log("\nRemoving change detector code from:")

        this._workingComponents.forEach(file => {
            console.log(" -",file.basename.replace(".ts", ""))
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

    removeDuplicateComponentsInList(){
        this._workingComponents = this._workingComponents.filter((e, i) => this._workingComponents.findIndex(a => a.basename === e.basename) === i);
    }
}



const options: any =
    usage("Usage: -p <path>")
        .option("p", { alias: "path", describe: "Path to root directory of Angular project", type: "string", demandOption: true })
        .option("m", { alias: "module", describe: "Feature module to apply to", type: "string", demandOption: false })
        .option("c", { alias: "component", describe: "Component to apply to", type: "string", demandOption: false })
        .option("undo", { describe: "Remove changes added by Change Detector", type: "boolean", demandOption: false })
        .option("v", { alias: "verbose", describe: "Output any logging", type: "boolean", demandOption: false })
        .argv;


const path = options.path

access(`${path}/angular.json`, async (err) => {
    if (!!err) {
        console.log("Not an Angular Directory");
        return
    } else {
        const changeDetector = new ChangeDetector(!!options.verbose)
        if (options.module) {
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


