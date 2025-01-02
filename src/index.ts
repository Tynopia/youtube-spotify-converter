import { Args, Command, Flags } from "@oclif/core"

export default class Convert extends Command {
    static args = {
        url: Args.url({ description: "The YouTube URL to the Video", required: true })
    }

    static description = "Say hello"

    static examples = [
        `<%= config.bin %> <%= command.id %> friend --from oclif
hello friend from oclif! (./src/commands/hello/index.ts)
`,
    ]

    static flags = {
        from: Flags.string({ char: "f", description: "Who is saying hello" }),
    }

    async run(): Promise<void> {
        const { args, flags } = await this.parse(Convert)

        this.log(`hello ${args.url} from ${flags.from}! (./src/commands/hello/index.ts)`)
    }
}
