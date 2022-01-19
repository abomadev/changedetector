#!/usr/bin/env node
import { eachLine } from 'line-reader';
import { replaceInFile } from 'replace-in-file';
import { appendFile, writeFile, readFile } from 'fs';
import lineByLine = require('n-readlines');

interface FileInfo {
    fullPath: string;
    basename: string;
}


export class ChangeDetector {
    readonly CD_FUNCTION_NAME = "__changeDectector__()";
    readonly CD_CALL_COUNTER = "\tprivate __changeDetectorCounter__ = 0";
    readonly CD_HTML_TAG = `<label id="__changeDetector__" hidden>{{ ${this.CD_FUNCTION_NAME} }}</label>`;
    readonly START_KEY = "export class";

    private _verbose = false;
    private _workingComponents: Array<FileInfo> = [];
    private _appModules: Array<string>;
    private _appComponents: Array<string>;

    constructor(modules: Array<string>, components: Array<string>, verbose: boolean) {
        this._appModules = modules;
        this._appComponents = components;
        this._verbose = verbose;
    }

    /**
     * For all components imported into the module or modules, add into working list of components 
     * to perform operations on.
     *     
     * @param module Name of module or list of modules
     */
    addModule(module: string | Array<string>) {
        const modules: Array<string> = typeof module === 'string' ? [module] : module;
        for (const moduleName of modules) {
            try {
                const moduleInfo: FileInfo | undefined = this.findAppFile(moduleName, "module");
                if (moduleInfo) {
                    const moduleComponents = this.extractComponentsFromModule(moduleInfo);
                    this._workingComponents.push(...moduleComponents);
                }
            } catch (error) {
                console.error(error);
            }
        }
    }

    /**
     * Add component or all listed components into the working list of components 
     * to perform operations on.
     * 
     * @param component Name of component or list of components
     */
    addComponent(component: string | Array<string>) {
        const components: Array<string> = typeof component === 'string' ? [component] : component;
        for (const componentName of components) {
            try {
                const componentInfo: FileInfo | undefined = this.findAppFile(componentName, "component");
                if (componentInfo) {
                    this._workingComponents.push(componentInfo);
                }
            } catch (error) {
                console.error(error);
            }
        }
    }

    /**
     * Adds ChangeDetector code snippets to the working list of components
     */
    addCodeToComponents(): void {
        this.removeDuplicateComponentsInList();
        if (this._workingComponents.length > 0) { console.log("\nAdding change detector code to:") }

        this._workingComponents.forEach(async file => {
            this.addCode(file.fullPath, file.basename);
        })
    }

    /**
     * Removes ChangeDetector code snippets from the working list of components
     */
    cleanComponents(): void {
        this.removeDuplicateComponentsInList();

        console.log("\nRemoving change detector code from:");

        this._workingComponents.forEach(file => {
            console.log(" -", file.basename.replace(".ts", ""));
            this.clean(file.fullPath);
        })
    }

    /**
     * Extract a list of imported components from the module.
     * 
     * @param moduleInfo Object containing the name and full path of a module
     * @returns A list of component names and paths
     */
    private extractComponentsFromModule(moduleInfo: FileInfo): Array<FileInfo> {
        const lineReader = new lineByLine(moduleInfo.fullPath);
        let lineObj: Buffer | false;
        let line: string;
        const components: Array<FileInfo> = [];

        if (this._verbose) { console.log(`\nFinding components imported by ${moduleInfo.basename}:`) }

        while (lineObj = lineReader.next()) {
            line = lineObj.toString('ascii');
            if (line.includes("import") && line.includes("from") && line.includes(".component")) {
                const imprtArr = line.split('/');

                const componentName = `${imprtArr[imprtArr.length - 1].replace(".component", "").replace(/[^a-zA-Z\-\.]/g, "")}`;
                const componentInfo: FileInfo | undefined = this.findAppFile(componentName, "component");

                if (componentInfo) {
                    components.push(componentInfo);
                    if (this._verbose) console.log(" *", componentInfo.basename.replace(".ts", ""));
                }
            }
        }
        return components;
    }

    /**
     * Find a specific component or module file within the Angular project.
     * 
     * @param name Name of the component or module
     * @param fileType Type of the file. Either 'component' or 'module'
     * @returns The names and full path of the component or module.
     */
    private findAppFile(name: string, fileType: "component" | "module"): FileInfo | undefined {
        const file = fileType === "module"
            ? this._appModules.find(module => module.includes(`${name}.module.ts`))
            : this._appComponents.find(component => component.includes(`${name}.component.ts`))

        if (!file) { throw new Error(`File ${name}.${fileType}.ts not found`) }

        return file ? { fullPath: file, basename: this.basename(file) } : undefined
    }

    /**
     * Add ChangeDetector code snippets to the component files
     * 
     * @param tsFullPath Path to the component's typescript file
     * @param basename The basename of the components typescript file
     */
    private addCode(tsFullPath: string, basename: string): void {
        const componetName = basename.replace(".ts", "")
        readFile(tsFullPath, (err, data) => {
            if (err)
                throw err;

            if (!data.includes("__changeDectector")) {
                console.log(" -", componetName)

                const htmlFullPath = tsFullPath.replace(".ts", ".html")
                this.addCodeToHtmlFile(htmlFullPath)
                console.log(tsFullPath)
                this.addCodeToTSFile(tsFullPath, basename)
            } else {
                console.log(" -", componetName, "(skipped)")
                if (this._verbose) console.log(`   Skipping ${componetName}: already contains change detector code\n`)
            }
        });
    }

    /**
     * Remove ChangeDetector code snippets from the component files
     * 
     * @param tsFullPath Path to the component's typescript file
     */
    private clean(tsFullPath: string): void {
        const htmlFullPath = tsFullPath.replace(".ts", ".html")
        this.cleanHtmlFile(htmlFullPath)
        this.cleanTSFile(tsFullPath)
    }

    /**
     * Add ChangeDetector code snippets to the component HTML file
     * 
     * @param fullPath Path to the component's HTML file
     */
    private async addCodeToHtmlFile(fullPath: string): Promise<void> {
        if(!fullPath.endsWith(".html")){
            throw new Error("Invalid file type")
        }

        await appendFile(fullPath, `${this.CD_HTML_TAG}`, (err) => {
            if (err) {
                throw err
            };
        });
    }

    /**
     * Add ChangeDetector code snippets to the component typescript file.
     * 
     * @param fullPath Path to the component's typescript file
     * @param basename The basename of the components typescript file
     */
    private addCodeToTSFile(fullPath: string, basename: string): void {
        if(!basename.endsWith(".ts")){
            throw new Error("Invalid file type")
        }

        let original = "";
        let origWithChanges = "";
        const componentName = this.toTitleCase(basename.split(".")[0]);

        eachLine(fullPath, (line: string) => {
            if (line.includes(this.START_KEY) || original) {
                original += line + "\n"
                origWithChanges += origWithChanges ? line + "\n" : line + "\n" + this.CD_CALL_COUNTER + "\n"
                if (this.isBalanced(original)) {
                    origWithChanges = origWithChanges.replace(/\}\n$/, `${this.generateCDFunction(componentName)}\n}\n`);
                    this.findAndReplace(fullPath, original, origWithChanges);
                    return false;
                }
            }
        });
    }

    /**
     * Removes ChangeDetector code snippets from the component HTML file.
     * 
     * @param fullPath Path to the component's HTML file
     */
    private cleanHtmlFile(fullPath: string): void {
        let cleaned = ""
        let lineObj: Buffer | false;
        let line: string;

        const lineReader = new lineByLine(fullPath);
        while (lineObj = lineReader.next()) {
            line = lineObj.toString('ascii');

            cleaned += line.includes(this.CD_HTML_TAG) ? line.replace(this.CD_HTML_TAG, "") : line + "\n";
        }
        writeFile(fullPath, cleaned, 'utf8', (err) => {
            if (err) return console.log(err);
        });
    }

    /**
     * Removes ChangeDetector code snippets from the component typescript file
     * 
     * @param fullPath Path to the component's typescript file
     */
    private cleanTSFile(fullPath: string): void {
        let original = "";
        let cleaned = "";
        let tmp_fn = "";
        let keyFound = false;
        let keyInLine = false;

        const lineReader = new lineByLine(fullPath);

        let lineObj: Buffer | false;
        let line: string;

        while (lineObj = lineReader.next()) {
            line = lineObj.toString('ascii');
            original += line + "\n";
            keyInLine = line.includes(this.CD_FUNCTION_NAME);

            if (keyInLine) { keyFound = true; }

            if (!line.includes(this.CD_CALL_COUNTER) && !keyFound && !keyInLine) {
                cleaned += line + "\n";
            } else {
                if (keyFound || keyInLine) {
                    tmp_fn += line + "\n";
                    if (this.isBalanced(tmp_fn)) {
                        this.findAndReplace(fullPath, original, cleaned);
                        break;
                    }
                }
            }
        }
    }

    /**
     * Capitalize the first character of a string.
     * 
     * @param str A string to perform on.
     * @returns The input string but with the first character capitalised
     */
    private toTitleCase(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Determine if the code string contains a 'Balanced' set of curly brackers. 
     * 
     * @param str The code string to check
     * @returns A boolean value indicating if the code snippet is balanced.
     */
    private isBalanced(str: string): boolean {
        return Array.from(str).reduce((uptoPrevChar, thisChar) => {
            ((thisChar === '{' && uptoPrevChar++ || thisChar === '}' && uptoPrevChar--));
            return uptoPrevChar;
        }, 0) === 0
    }

    /**
     * Find a given string in a file and replace it.
     * 
     * @param fullPath Path to the file
     * @param findStr Text to search the file for
     * @param changeTo Text to replace 'findStr' with 
     */
    private async findAndReplace(fullPath: string, findStr: string, changeTo: string): Promise<void> {
        const options = {
            files: fullPath,
            from: findStr,
            to: changeTo,
        };
        try {
            await replaceInFile(options);
        }
        catch (error) {
            console.error('Error occurred:', error);
        }
    }

    /**
     * Create a code snippet implementing the function which will be called whenever the 
     * Angular component is rendered.
     * 
     * @param name The name of the component
     * @returns String representation of the function body.
     */
    private generateCDFunction(name: string): string {
        return `\t${this.CD_FUNCTION_NAME} {\n\t\tconsole.log("%c[ ${name} component ] Change detection called", 'font-weight: bold;', this.__changeDetectorCounter__)\n\t\tthis.__changeDetectorCounter__++\n\t}`;
    }

    /**
     * Remove duplicates from the working list of components.
     */
    private removeDuplicateComponentsInList(): void {
        this._workingComponents = this._workingComponents.filter((e, i) => this._workingComponents.findIndex(a => a.basename === e.basename) === i);
    }

    /**
     * Get the basename of the given file or folder
     * @param fullPath Path to a file or folder
     * @returns The basename
     */
    private basename(fullPath: string): string {
        const arr = fullPath.split("/");
        return arr[arr.length - 1];
    }
}
