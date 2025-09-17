import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
import { Command } from "@oclif/core";
import { readdirSync, mkdirSync, existsSync } from "fs";
import { join, extname, basename } from "path";
import ora from "ora";


import ffmpeg from "fluent-ffmpeg";

ffmpeg.setFfmpegPath(ffmpegPath);

export default class Convert extends Command {
    static description = "Removes subtitles from YouTube videos in current location"

    async run(): Promise<void> {
        const inputDir = process.cwd();
        const outputDir = join(inputDir, "out");

        if (!existsSync(outputDir)) {
            mkdirSync(outputDir);
        }

        const files = readdirSync(inputDir).filter(f => extname(f).toLowerCase() === ".mp4");

        for (const file of files) {
            const inputPath = join(inputDir, file);
            const outputPath = join(outputDir, basename(file));

            const spinner = ora(file).start();

            await new Promise<void>((resolve, reject) => {
                ffmpeg(inputPath)
                    .videoFilter("drawbox=x=0:y=ih-100:w=iw:h=100:color=black:t=fill")
                    .output(outputPath)
                    .on("end", () => {
                        spinner.succeed(file);
                        resolve();
                    })
                    .on("error", (err) => {
                        spinner.fail(file);
                        reject(err);
                    })
                    .run();
            });
        }
    }
}
