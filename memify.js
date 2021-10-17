"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Memify = void 0;
// import module
const sharp_1 = __importDefault(require("sharp"));
const canvas_1 = require("canvas");
const word_wrap_1 = __importDefault(require("word-wrap"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const https = __importStar(require("https"));
// is url
function isUrl(input) {
    let str_regex = '^(?:http|ftp)s?://'; // http:// or https://
    str_regex += '(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|'; // domain...
    str_regex += 'localhost|'; // localhost...
    str_regex += '\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'; // ...or ip
    str_regex += '(?::\d+)?'; // optional port
    str_regex += '(?:/?|[/?]\S+)$';
    let regex = new RegExp(str_regex, 'i');
    return regex.test(input);
}
// download url
function downloadUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            const chunks = [];
            res.on('error', (err) => reject(err));
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            ;
        });
    });
}
// load image
function loadImage(image) {
    return new Promise((resolve, reject) => {
        let img = new canvas_1.Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = image;
    });
}
// load fonts
function loadFont() {
    try {
        let font_dir = 'assets/fonts';
        let files = fs.readdirSync(font_dir);
        files.forEach((file) => {
            try {
                canvas_1.registerFont(`${font_dir}/${file}`, { family: file.replace(/\.[^/.]+$/, '') });
            }
            catch (error) {
                console.log(`${font_dir}/${file} not font file`);
            }
        });
    }
    catch (error) {
        console.log("There problem :", error);
        return false;
    }
    return true;
}
loadFont();
// main class
class Memify {
    constructor() { }
    measure(ctx, text) {
        let measure = ctx.measureText(text);
        let char_height = measure.emHeightAscent + measure.emHeightDescent;
        let char_width = measure.width;
        return [char_width, char_height];
    }
    add_text_to_image(image, text1, text2 = "", callback) {
        if (typeof text2 == "function" && typeof callback == "undefined") {
            callback = text2;
            text2 = "";
        }
        if (typeof text2 != "string") {
            text2 = "";
        }
        let copy_image = image;
        return new Promise((resolve, rejects) => __awaiter(this, void 0, void 0, function* () {
            try {
                let font_size = 12;
                // image
                if (isUrl(image.toString())) {
                    console.log('is url');
                    image = yield downloadUrl(image);
                }
                let img = yield sharp_1.default(image).metadata();
                let canvas = canvas_1.createCanvas(img.width, img.height);
                let ctx = canvas.getContext('2d');
                if (typeof image == 'string') {
                    image = (yield loadImage(image));
                }
                else {
                    image = (yield loadImage(copy_image));
                }
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                // process
                font_size = Math.floor((img.height * font_size) / 100);
                if (os.platform() == "win32") {
                    ctx.font = `bold ${font_size}px sans`;
                }
                else {
                    ctx.font = `${font_size}px impact`;
                }
                let [char_width, char_height] = this.measure(ctx, 'A');
                let chars_per_line = Math.floor(img.width / char_width);
                let text_wrap_options = {
                    width: chars_per_line,
                    indent: '',
                    cut: true
                };
                let top_lines = word_wrap_1.default(text1, text_wrap_options).split('\n').filter((_value, index) => index <= 2);
                let bottom_lines = word_wrap_1.default(text2, text_wrap_options).split('\n').filter((_value, index) => index <= 2);
                // add text top line
                if (top_lines.length) {
                    let y = 90;
                    for (let line of top_lines) {
                        let [line_width, line_height] = this.measure(ctx, line);
                        let x = (img.width - line_width) / 2;
                        ctx.strokeStyle = "black";
                        ctx.fillStyle = "white";
                        ctx.fillText(line, x, y);
                        y += line_height;
                    }
                }
                // add text bottom line
                if (bottom_lines.length) {
                    let y = img.height - char_height * bottom_lines.length - 15;
                    ;
                    for (let line of bottom_lines) {
                        let [line_width, line_height] = this.measure(ctx, line);
                        let x = (img.width - line_width) / 2;
                        ctx.strokeStyle = "black";
                        ctx.fillStyle = "white";
                        ctx.fillText(line, x, y);
                        y += line_height;
                    }
                }
                // finish
                if (typeof callback == "function") {
                    callback(canvas);
                }
                resolve(canvas.toBuffer('image/png'));
            }
            catch (e) {
                // reject error
                rejects(e);
            }
        }));
    }
}
exports.Memify = Memify;
exports.default = Memify;
