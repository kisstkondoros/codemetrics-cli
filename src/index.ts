import path from "path";
import { promisify } from "util";

import { MetricsParser, MetricsConfiguration } from "tsmetrics-core";
import { ScriptTarget } from "typescript";
import glob from "glob";
import findUp from 'find-up';
import { program } from 'commander';

export function run() {
    program
        .option('-t, --threshold <number>', 'Minimum complexity to be shown')
        .option('-c, --config <string>', 'Path to the config file')
        .option('-l, --lint', 'Exit with non-zero on issues')
        .option('-d, --deep', 'Show complexity results from top level nodes, rather than an aggregation per file')
        .option('-p, --pattern <string>', 'Glob pattern').parse(process.argv);

    const options = program.opts();

    let {
        threshold,
        pattern,
        config,
        lint = false,
        deep = false,
    } = options as {
        threshold: number;
        pattern: string;
        config: string;
        lint: boolean;
        deep: boolean;
    };

    threshold = threshold || 0;
    pattern = pattern || "**/*.{ts,tsx,js,jsx}";
    const configFilePromise = config ? Promise.resolve(path.resolve(process.cwd(), config)) : findUp('codemetrics.config.js');
    const configPromise = configFilePromise.then(configFile => configFile ? require(configFile) : {});
    const result = new Map<string, number>();
    const globPromisified = promisify(glob);
    return configPromise
        .then(config => ({ ...MetricsConfiguration, ...config }))
        .then(config => {
            return globPromisified(pattern, {
                cwd: process.cwd(),
                absolute: true,
                dot: false,
                follow: false,
                ignore: ["**/node_modules/**"]
            }).then(files => {
                files.forEach(filePath => {
                    const { metrics } = MetricsParser.getMetrics(filePath, config, ScriptTarget.Latest);
                    const fileLevelComplexity = metrics.getCollectedComplexity();

                    if (threshold >= fileLevelComplexity) return;

                    if (deep) {
                        metrics.children.forEach((child) => {
                            const topLevelChildComplexity = child.getCollectedComplexity();
                            if (threshold <= topLevelChildComplexity) {
                                result.set(`${filePath}:${child.line}`, topLevelChildComplexity);
                            }
                        })
                    } else {
                        result.set(filePath, fileLevelComplexity);
                    }
                });

                const sorted = new Map([...result.entries()].sort((a, b) => a[1] - b[1]));

                sorted.forEach((complexity, filePath) => {
                    console.log(complexity, filePath);
                })

                if(lint && sorted.size > 0) {
                    process.exit(1);
                }

            })
        }).catch(e => {
            console.error(e);
            process.exit(1);
        })
}

export { MetricsConfiguration } from "tsmetrics-core";