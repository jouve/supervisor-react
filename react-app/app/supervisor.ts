export enum ProcessStates {
  STOPPED = 0,
  STARTING = 10,
  RUNNING = 20,
  BACKOFF = 30,
  STOPPING = 40,
  EXITED = 100,
  FATAL = 200,
  UNKNOWN = 1000,
}

export const STOPPED_STATES = [ProcessStates.STOPPED, ProcessStates.EXITED, ProcessStates.FATAL, ProcessStates.UNKNOWN];

export const RUNNING_STATES = [ProcessStates.STARTING, ProcessStates.RUNNING, ProcessStates.BACKOFF];

export enum SupervisorStates {
  FATAL = 2,
  RUNNING = 1,
  RESTARTING = 0,
  SHUTDOWN = -1,
}

export interface State {
  statecode: SupervisorStates;
  statename: keyof typeof SupervisorStates;
}

export interface ProcessInfo {
  name: string;
  group: string;
  start: number;
  stop: number;
  now: number;
  state: ProcessStates;
  statename: keyof typeof ProcessStates;
  spawnerr: string;
  exitstatus: number;
  logfile: string;
  stdout_logfile: string;
  stderr_logfile: string;
  pid: number;
  description: string;
}

export class Supervisor {
  setProcesses: React.Dispatch<React.SetStateAction<ProcessInfo[]>>;

  constructor(setProcesses: React.Dispatch<React.SetStateAction<ProcessInfo[]>>) {
    this.setProcesses = setProcesses;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  methodCall = async (method: string, params: string[]): Promise<any> =>
    await (
      await fetch(`${window.location.origin}/RPC2`, {
        method: "POST",
        body: JSON.stringify({
          params: params,
          methodname: method,
        }),
      })
    ).json();

  getSupervisorVersion = async () => (await this.methodCall("supervisor.getSupervisorVersion", [])) as string;

  getState = async () => ((await this.methodCall("supervisor.getState", [])) as State).statename;

  getAllProcessInfo = async () => {
    try {
      this.setProcesses(await this.methodCall("supervisor.getAllProcessInfo", []));
    } catch {
      this.setProcesses([]);
    }
  };

  startProcess = async (process: ProcessInfo) => {
    await this.methodCall("supervisor.startProcess", [`${process.group}:${process.name}`]);
    await this.getAllProcessInfo();
  };

  startProcessGroup = async (name: string) => {
    await this.methodCall("supervisor.startProcessGroup", [name]);
    await this.getAllProcessInfo();
  };

  startAllProcesses = async () => {
    await this.methodCall("supervisor.startAllProcesses", []);
    await this.getAllProcessInfo();
  };

  stopProcess = async (process: ProcessInfo) => {
    await this.methodCall("supervisor.stopProcess", [`${process.group}:${process.name}`]);
    await this.getAllProcessInfo();
  };

  stopProcessGroup = async (name: string) => {
    await this.methodCall("supervisor.stopProcessGroup", [name]);
    await this.getAllProcessInfo();
  };

  stopAllProcesses = async () => {
    await this.methodCall("supervisor.stopAllProcesses", []);
    await this.getAllProcessInfo();
  };

  restartProcess = async (process: ProcessInfo) => {
    try {
      if (RUNNING_STATES.includes(process.state)) {
        await this.stopProcess(process);
      }
    } finally {
      await this.startProcess(process);
    }
  };

  restartProcessGroup = async (name: string) => {
    await this.stopProcessGroup(name);
    await this.startProcessGroup(name);
  };

  restartAllProcesses = async () => {
    await this.stopAllProcesses();
    await this.startAllProcesses();
  };

  clearProcessLogs = (process: ProcessInfo) =>
    this.methodCall("supervisor.clearProcessLogs", [`${process.group}:${process.name}`]);

  clearAllProcessLogs = () => this.methodCall("supervisor.clearAllProcessLogs", []);
}
