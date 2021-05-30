#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var line_reader_1 = require("line-reader");
var replace_in_file_1 = require("replace-in-file");
var yargs_1 = require("yargs");
var readdirp_1 = require("readdirp");
var fs_1 = require("fs");
var lineByLine = require('n-readlines');
var cdFunctionName = "__changeDectector__()";
var cdCallCounter = "\tprivate __changeDetectorCounter__ = 0";
var cdHtmlTag = "<label id=\"__changeDetector__\" hidden>{{ " + cdFunctionName + " }}</label>";
var ChangeDetector = /** @class */ (function () {
    function ChangeDetector(verbose) {
        this._verbose = false;
        this._workingComponents = [];
        this._verbose = verbose;
    }
    ChangeDetector.prototype.addModule = function (moduleName) {
        return __awaiter(this, void 0, void 0, function () {
            var mod, modComponents;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.findFile(path, moduleName + ".module.ts")];
                    case 1:
                        mod = _b.sent();
                        return [4 /*yield*/, this.extractComponentsFromModule(mod.fullPath)];
                    case 2:
                        modComponents = _b.sent();
                        (_a = this._workingComponents).push.apply(_a, modComponents);
                        return [2 /*return*/];
                }
            });
        });
    };
    ChangeDetector.prototype.addComponent = function (componentName) {
        return __awaiter(this, void 0, void 0, function () {
            var component;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.findFile(path, componentName + ".component.ts")];
                    case 1:
                        component = _a.sent();
                        this._workingComponents.push(component);
                        return [2 /*return*/];
                }
            });
        });
    };
    Object.defineProperty(ChangeDetector.prototype, "verbose", {
        get: function () {
            return this._verbose;
        },
        enumerable: false,
        configurable: true
    });
    ChangeDetector.prototype.cleanComponents = function () {
        var _this = this;
        if (this.verbose)
            console.log("Removing change detector code from:");
        this._workingComponents.forEach(function (file) {
            if (_this.verbose)
                console.log(file.basename.replace(".ts", ""));
            _this.clean(file.fullPath);
        });
    };
    ChangeDetector.prototype.addCodeToComponents = function () {
        var _this = this;
        if (this.verbose)
            console.log("Adding change detector code to:");
        this._workingComponents.forEach(function (file) {
            if (_this.verbose)
                console.log(file.basename.replace(".ts", ""));
            _this.addCode(file.fullPath, file.basename);
        });
    };
    ChangeDetector.prototype.generateCDFunction = function (name) {
        return "\t" + cdFunctionName + " {\n\t\tconsole.log(\"[ " + name + " component ] Change detection called\", this.__changeDetectorCounter__)\n\t\tthis.__changeDetectorCounter__++\n\t}";
    };
    // isBalanced([...str]) {
    ChangeDetector.prototype.isBalanced = function (str) {
        return Array.from(str).reduce(function (uptoPrevChar, thisChar) {
            ((thisChar === '{' && uptoPrevChar++ || thisChar === '}' && uptoPrevChar--));
            return uptoPrevChar;
        }, 0) === 0;
    };
    ChangeDetector.prototype.findAndReplace = function (filename, findStr, changeTo) {
        return __awaiter(this, void 0, void 0, function () {
            var options, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        options = {
                            files: filename,
                            from: findStr,
                            to: changeTo,
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, replace_in_file_1.replaceInFile(options)];
                    case 2:
                        result = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Error occurred:', error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ChangeDetector.prototype.addCodeToTSFile = function (fullPath, basename) {
        var _this = this;
        var original = "";
        var origWithChanges = "";
        var startKey = "export class";
        var componentName = this.toTitleCase(basename.split(".")[0]);
        line_reader_1.eachLine(fullPath, function (line) {
            if (line.includes(startKey) || original) {
                original += line + "\n";
                origWithChanges += origWithChanges ? line + "\n" : line + "\n" + cdCallCounter + "\n";
                if (_this.isBalanced(original)) {
                    origWithChanges = origWithChanges.replace(/\}\n$/, _this.generateCDFunction(componentName) + "\n}\n");
                    _this.findAndReplace(fullPath, original, origWithChanges);
                    return false;
                }
            }
        });
    };
    ChangeDetector.prototype.addCodeToHtmlFile = function (fullPath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fs_1.appendFile(fullPath, "" + cdHtmlTag, function (err) {
                            if (err)
                                throw err;
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    ChangeDetector.prototype.addCode = function (tsFullPath, basename) {
        var htmlFullPath = tsFullPath.replace(".ts", ".html");
        this.addCodeToHtmlFile(htmlFullPath);
        this.addCodeToTSFile(tsFullPath, basename);
    };
    ChangeDetector.prototype.toTitleCase = function (str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };
    ChangeDetector.prototype.cleanHtmlFile = function (fullPath) {
        var original = "";
        var cleaned = "";
        var lineObj;
        var line;
        var lineReader = new lineByLine(fullPath);
        while (lineObj = lineReader.next()) {
            line = lineObj.toString('ascii');
            original += line + "\n";
            cleaned += line.includes(cdHtmlTag) ? line.replace(cdHtmlTag, "") : line + "\n";
        }
        fs_1.writeFile(fullPath, cleaned, 'utf8', function (err) {
            if (err)
                return console.log(err);
        });
    };
    ChangeDetector.prototype.cleanTSFile = function (fullPath) {
        var original = "";
        var cleaned = "";
        var tmp_fn = "";
        var keyFound = false;
        var keyInLine = false;
        var lineReader = new lineByLine(fullPath);
        var lineObj;
        var line;
        while (lineObj = lineReader.next()) {
            line = lineObj.toString('ascii');
            original += line + "\n";
            keyInLine = line.includes(cdFunctionName);
            if (keyInLine) {
                keyFound = true;
            }
            if (!line.includes(cdCallCounter) && !keyFound && !keyInLine) {
                cleaned += line + "\n";
            }
            else {
                if (keyFound || keyInLine) {
                    tmp_fn += line + "\n";
                    if (this.isBalanced(tmp_fn)) {
                        this.findAndReplace(fullPath, original, cleaned);
                        break;
                    }
                }
            }
        }
    };
    ChangeDetector.prototype.clean = function (tsFullPath) {
        var htmlFullPath = tsFullPath.replace(".ts", ".html");
        this.cleanHtmlFile(htmlFullPath);
        this.cleanTSFile(tsFullPath);
    };
    ChangeDetector.prototype.getFilesList = function (path, filter) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, readdirp_1.promise(path, { fileFilter: filter })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    ChangeDetector.prototype.findFile = function (path, filter) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getFilesList(path, filter)
                            .then(function (files) { return files[0]; })
                            .catch(function (err) {
                            throw new Error(err);
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    ChangeDetector.prototype.extractComponentsFromModule = function (modulePath) {
        return __awaiter(this, void 0, void 0, function () {
            var lineReader, lineObj, line, components, imprtArr, componentName, fileInfo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        lineReader = new lineByLine(modulePath);
                        components = [];
                        _a.label = 1;
                    case 1:
                        if (!(lineObj = lineReader.next())) return [3 /*break*/, 4];
                        line = lineObj.toString('ascii');
                        if (!(line.includes("import") && line.includes("from") && line.includes(".component"))) return [3 /*break*/, 3];
                        imprtArr = line.split('/');
                        componentName = imprtArr[imprtArr.length - 1].replace(/[^a-zA-Z\-\.]/g, "") + ".ts";
                        return [4 /*yield*/, this.findFile(path, componentName)];
                    case 2:
                        fileInfo = _a.sent();
                        components.push(fileInfo);
                        _a.label = 3;
                    case 3: return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, components];
                }
            });
        });
    };
    return ChangeDetector;
}());
var options = yargs_1.usage("Usage: -p <path>")
    .option("p", { alias: "path", describe: "Path to root directory of Angular project", type: "string", demandOption: true })
    .option("m", { alias: "module", describe: "Feature module to apply to", type: "string", demandOption: false })
    .option("c", { alias: "component", describe: "Single component to apply", type: "string", demandOption: false })
    .option("undo", { describe: "Remove changes added by Change Detector", type: "boolean", demandOption: false })
    .option("v", { alias: "verbose", describe: "Output any logging", type: "boolean", demandOption: false })
    .argv;
var path = options.path;
// console.log({ options })
// console.log(typeof options.c)
fs_1.access(path + "/angular.json", function (err) { return __awaiter(void 0, void 0, void 0, function () {
    var changeDetector;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!!!err) return [3 /*break*/, 1];
                console.log("Not an Angular Directory");
                return [2 /*return*/];
            case 1:
                changeDetector = new ChangeDetector(!!options.verbose);
                if (!options.module) return [3 /*break*/, 3];
                // Need to handle the case of multiple 
                return [4 /*yield*/, changeDetector.addModule(options.module)];
            case 2:
                // Need to handle the case of multiple 
                _a.sent();
                _a.label = 3;
            case 3:
                if (!options.component) return [3 /*break*/, 5];
                return [4 /*yield*/, changeDetector.addComponent(options.component)];
            case 4:
                _a.sent();
                _a.label = 5;
            case 5:
                if (options.undo) {
                    changeDetector.cleanComponents();
                }
                else {
                    changeDetector.addCodeToComponents();
                }
                _a.label = 6;
            case 6: return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=index.js.map