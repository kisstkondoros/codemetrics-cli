import path from "path";
import { promisify } from "util";

import { MetricsParser, MetricsConfiguration } from "tsmetrics-core";
import { ScriptTarget } from "typescript";
import glob from "glob";
import findUp from 'find-up';
import program from 'commander';

export function run() {
    program
        .option('-t, --threshold <number>', 'Minimum complexity to be shown')
        .option('-c, --config <string>', 'Path to the config file')
        .option('-p, --pattern <string>', 'Glob pattern').parse(process.argv);

    let { threshold, pattern, config } = program as unknown as { threshold: number, pattern: string, config: string }

    threshold = threshold || 0;
    pattern = pattern || "**/*.{ts,tsx,js,jsx,lua}";
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
                files.forEach(p => {
                    const metrics = MetricsParser.getMetrics(p, config, ScriptTarget.Latest);
                    const complexity = metrics.metrics.getCollectedComplexity();
                    if (threshold <= complexity) {
                        result.set(p, complexity);
                    }
                });

                const sorted = new Map([...result.entries()].sort((a, b) => a[1] - b[1]));

                sorted.forEach((key, value) => {
                    console.log(key, value);
                })

            })
        }).catch(e => {
            console.error(e);
            process.exit(1);
        })
}

export { MetricsConfiguration } from "tsmetrics-core";