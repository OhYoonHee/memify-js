// import module
import sharp from 'sharp';
import { registerFont, createCanvas, Image } from 'canvas';
import textwrap from 'word-wrap';
import * as fs from 'fs';
import * as os from 'os';
import * as https from 'https';

// import type
import type { Canvas, NodeCanvasRenderingContext2D } from 'canvas';


// is url
function isUrl(input: string) {
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
function downloadUrl(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            const chunks: any[] = []

            res.on('error', (err) => reject(err));
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));;
        });
    });
}

// load image
function loadImage(image: any): Promise<any> {
    return new Promise((resolve, reject) => {
        let img = new Image();
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
                registerFont(`${font_dir}/${file}`, { family: file.replace(/\.[^/.]+$/, '') });
            } catch (error) {
                console.log(`${font_dir}/${file} not font file`);
            }
        });
    } catch (error) {
        console.log("There problem :", error);
        return false;
    }
    return true;
}

loadFont();

// main class
export class Memify {
    constructor() { }

    measure(ctx: NodeCanvasRenderingContext2D, text: string) {
        let measure: any = ctx.measureText(text);
        let char_height = measure.emHeightAscent + measure.emHeightDescent;
        let char_width = measure.width;
        return [char_width, char_height];
    }

    add_text_to_image(image: string | Buffer, text1: string, text2: string | Function = "", callback?: (canvas: Canvas) => void): Promise<Buffer> {
        if (typeof text2 == "function" && typeof callback == "undefined") {
            callback = text2 as any;
            text2 = "";
        }
        if (typeof text2 != "string") {
            text2 = "";
        }
        let copy_image = image;

        return new Promise(async (resolve, rejects) => {
            try {
                let font_size = 12;

                // image
                if (isUrl(image.toString())) {
                    console.log('is url')
                    image = await downloadUrl(image as string);
                }
                let img = await sharp(image).metadata() as any;
                let canvas = createCanvas(img.width, img.height);
                let ctx = canvas.getContext('2d');
                if (typeof image == 'string') {
                    image = await loadImage(image) as any;
                } else {
                    image = await loadImage(copy_image) as any
                }
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

                // process
                font_size = Math.floor((img.height * font_size) / 100);
                if (os.platform() == "win32") {
                    ctx.font = `bold ${font_size}px sans`;
                } else {
                    ctx.font = `${font_size}px impact`;
                }
                let [char_width, char_height] = this.measure(ctx, 'A');
                let chars_per_line = Math.floor(img.width / char_width);
                let text_wrap_options = {
                    width: chars_per_line,
                    indent: '',
                    cut: true
                };
                let top_lines = textwrap(text1, text_wrap_options).split('\n').filter((_value: string, index: number) => index <= 2);
                let bottom_lines = textwrap(text2 as string, text_wrap_options).split('\n').filter((_value: string, index: number) => index <= 2);

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
                    let y = img.height - char_height * bottom_lines.length - 15;;
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
            } catch (e) {
                // reject error
                rejects(e);
            }
        });
    }
}

export default Memify;