import { spawn, ChildProcess } from "node:child_process";
import { createInterface } from "node:readline";
import { createRequire } from "node:module";
import { Command } from "commander";
import { debounce } from "./debounce.js";
import { parseArgsStringToArgv } from "string-argv";

const require = createRequire(import.meta.url);
const swcBinaryPath = require.resolve("@swc/cli/bin/swc");
const commandKillSignal = "SIGKILL";

const program = new Command("swc-watch");

program
  .argument("[args...]")
  .allowUnknownOption()
  .option("-c, --command <string>", "executes command on every sucessful compilation")
  .action((args, { command }) => {
    const commandArgv = parseArgsStringToArgv(command);
    const [commandSpawnCommand, ...commandSpawnArgs] = commandArgv;

    const swcProcess = spawn("node", [swcBinaryPath, "--watch", "--log-watch-compilation", ...args]);

    const swcProcesReadline = createInterface({
      input: swcProcess.stdout,
    });

    /** @type {ChildProcess} */
    let commandProcess;
    const respawnProcess = debounce(() => {
      if (commandProcess) {
        if (commandProcess.kill(commandKillSignal)) {
          console.log(`SWC-Watch: Sent ${commandKillSignal} signal to process.`);
        } else {
          console.error(`SWC-Watch: Failed to send ${commandKillSignal} signal to process.`);
          process.exit(1);
        }
      }

      commandProcess = spawn(commandSpawnCommand, commandSpawnArgs, {
        stdio: "inherit",
      });

      commandProcess.once("spawn", () => {
        console.log("SWC-Watch: Process spawned.");
      });
      commandProcess.once("exit", (code) => {
        console.log(`SWC-Watch: Process exited with exit code: ${code}`);
      });

      return commandProcess;
    }, 100);

    swcProcesReadline.on("line", (input) => {
      console.log(`SWC: ${input}`);
      respawnProcess();
    });
  });

export { program };
