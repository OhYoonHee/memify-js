/// <reference types="node" />
import type { Canvas, NodeCanvasRenderingContext2D } from 'canvas';
export declare class Memify {
    constructor();
    measure(ctx: NodeCanvasRenderingContext2D, text: string): any[];
    add_text_to_image(image: string | Buffer, text1: string, text2?: string | Function, callback?: (canvas: Canvas) => void): Promise<Buffer>;
}
export default Memify;
