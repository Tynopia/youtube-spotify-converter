import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
import { Command } from "@oclif/core"

import inquirer from "inquirer";
import ffmpeg from "fluent-ffmpeg";
import ytdl from "@distube/ytdl-core"
import ora from "ora";

ffmpeg.setFfmpegPath(ffmpegPath);

export default class Convert extends Command {
    static description = "Convert a YouTube Video to a 9:16 Spotify Canvas Video"

    async run(): Promise<void> {
        process.env.YTDL_NO_UPDATE = "1"

        const { url } = await inquirer.prompt([
            {
                type: "input",
                name: "url",
                message: "What is the YouTube Video URL?",
                required: true,
                validate(value) {
                    return ytdl.validateURL(value);
                }
            }
        ])

        const info = await ytdl.getInfo(url);

        const { format, scale, start, duration } = await inquirer.prompt([
            {
                type: "list",
                name: "format",
                message: "What quality do you want to download?",
                choices: info.formats
                    .filter(format => format.container === "mp4" && format.hasVideo)
                    .map(format => {
                        return {
                            name: `${format.qualityLabel} ${format.fps ? `- ${format.fps} fps` : ""}`,
                            value: format
                        }
                    })
            },
            {
                type: "number",
                name: "scale",
                message: "How much percent do want to scale the video?",
                default: 45,
                required: true
            },
            {
                type: "input",
                name: "start",
                message: "Provide a start time for the video (##:##)",
                required: true,
                validate(value) {
                    const match = value.match(/^(\d{1,2})(?::(\d{1,2}))?$/);

                    if (!match) {
                        return "Please provide a valid time format.";
                    }

                    const minutes = parseInt(match[1], 10);
                    const seconds = match[2] ? parseInt(match[2], 10) : 0;

                    if (minutes > 59 || seconds > 59) {
                        return "The time can't be greater than 59.";
                    }

                    if (minutes < 0 || seconds < 0) {
                        return "The time can't be negative.";
                    }

                    return true;
                },
                filter(answer) {
                    const match = answer.match(/^(\d{1,2})(?::(\d{1,2}))?$/);

                    if (!match) return answer;

                    const hours = String(match[1]).padStart(2, "0");
                    const minutes = match[2] ? String(match[2]).padStart(2, "0") : "00";

                    return `${hours}:${minutes}`;
                }
            },
            {
                type: "number",
                name: "duration",
                message: "How long should the video be?",
                default: 10,
                required: true
            }
        ])

        const spinner = ora("Downloading and converting video")

        const video = ytdl(url, {
            format
        })

        ffmpeg(video)
            .on("start", function () {
                spinner.start()
            })
            .on("end", function () {
                spinner.succeed("Download and merge complete!")
            })
            .outputOptions([
                "-vf",
                `crop=in_h*9/16:in_h:(in_w-out_w)/2:0,scale=${this.calculateScale(1080, scale)}:${this.calculateScale(1920, scale)},crop=1080:1920:(in_w-out_w)/2:(in_h-out_h)/2`,
                `-ss ${start}`,
                `-t ${this.formatDuration(duration)}`
            ])
            .save(`output-${info.videoDetails.videoId}.mp4`)
    }

    private formatDuration(duration: number) {
        const seconds = duration % 60;
        const minutes = Math.floor(duration / 60);

        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }

    private calculateScale(value: number, scale: number) {
        return Math.floor(value * ((100 + scale) / 100))
    }
}
