import React, { useEffect, useState } from "react";

import {
  AppBar,
  Container,
  CssBaseline,
  IconButton,
  Link,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
  Typography,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@material-ui/core";

import { ClearAll, Loop, PlayArrow, Stop, Replay, Menu as MenuIcon } from "@material-ui/icons";

import "typeface-roboto";

import "./App.css";

const xmlrpc = require("node-xmlrpc");

interface IProcess {
  description: string;
  statename: string;
  name: string;
  group: string;
}

interface IGroup {
  [id: string]: IProcess;
}

interface IProcesses {
  [id: string]: IGroup;
}

interface XmlrpcClient {
  methodCall: (method: string, params: string[], callback: (error: any, value: any) => void) => void;
}

interface IStartStopObject {
  description: string;
  group: string;
  name: string;
  status: number;
}

class Supervisor {
  client: XmlrpcClient;
  processes: IProcesses;

  constructor() {
    this.client = xmlrpc.createClient({
      host: window.location.hostname,
      port: window.location.port,
      path: "/RPC2",
    });
    this.processes = {};
  }

  methodCall = (method: string, params: string[]): Promise<any> =>
    new Promise((resolve, reject) =>
      this.client.methodCall(method, params, (error: string, value: any) => (error ? reject(error) : resolve(value)))
    );

  getSupervisorVersion = (): Promise<string> => this.methodCall("supervisor.getSupervisorVersion", []);

  getState = () =>
    this.methodCall("supervisor.getState", []).then(
      (value: { statecode: number; statename: string }) => value.statename
    );

  getAllProcessInfo = () =>
    this.methodCall("supervisor.getAllProcessInfo", []).then((value: IProcess[]) => {
      const processes: IProcesses = {};
      value.forEach((e) => {
        let group = processes[e.group];
        if (group === undefined) {
          group = processes[e.group] = {};
        }
        group[e.name] = e;
      });
      return processes;
    });

  getProcessInfo = (group: string, name: string): Promise<IProcess> =>
    this.methodCall("supervisor.getProcessInfo", [`${group}:${name}`]);

  startProcess = (group: string, name: string) =>
    this.methodCall("supervisor.startProcess", [`${group}:${name}`]).then((value: boolean) =>
      this.getProcessInfo(group, name)
    );

  startProcessGroup = (name: string) =>
    this.methodCall("supervisor.startProcessGroup", [name]).then((value: IStartStopObject[]) =>
      value.map((e: IStartStopObject) => this.getProcessInfo(name, e.name))
    );

  startAllProcesses = () =>
    this.methodCall("supervisor.startAllProcesses", []).then((value: IStartStopObject[]) =>
      value.map((e) => this.getProcessInfo(e.group, e.name))
    );

  stopProcess = (group: string, name: string) =>
    this.methodCall("supervisor.stopProcess", [`${group}:${name}`]).then((value: any) =>
      this.getProcessInfo(group, name)
    );

  stopProcessGroup = (name: string) =>
    this.methodCall("supervisor.stopProcessGroup", [name]).then((value: IStartStopObject[]) =>
      value.map((e) => this.getProcessInfo(name, e.name))
    );

  stopAllProcesses = () =>
    this.methodCall("supervisor.stopAllProcesses", []).then((value: IStartStopObject[]) =>
      value.map((e) => this.getProcessInfo(e.group, e.name))
    );

  restartProcess = (group: string, name: string, setProcess: (process: IProcess) => void) =>
    this.stopProcess(group, name)
      .then(setProcess)
      .then((value) => this.startProcess(group, name))
      .then(setProcess);

  restartProcessGroup = (name: string, setProcess: (process: IProcess | IProcess[]) => void) =>
    this.stopProcessGroup(name)
      .then((value) => Promise.all(value))
      .then(setProcess)
      .then((value) => this.startProcessGroup(name))
      .then((value) => Promise.all(value))
      .then(setProcess);

  restartAllProcesses = (setProcess: (process: IProcess | IProcess[]) => void) =>
    this.stopAllProcesses()
      .then((value) => Promise.all(value))
      .then(setProcess)
      .then((value) => this.startAllProcesses())
      .then((value) => Promise.all(value))
      .then(setProcess);

  clearProcessLogs = (group: string, process: string) =>
    this.methodCall("supervisor.clearProcessLogs", [`${group}:${process}`]);

  clearAllProcessLogs = () => this.methodCall("supervisor.clearAllProcessLogs", []);
}

const clsOfStatename = (statename: string) => {
  if (statename === "RUNNING") {
    return "statusrunning";
  } else if (statename === "FATAL" || statename === "BACKOFF") {
    return "statuserror";
  } else {
    return "statusnominal";
  }
};

const Process = (props: {
  value: IProcess;
  supervisor: Supervisor;
  setProcess: (process: IProcess | IProcess[]) => void;
}) => (
  <TableRow>
    <TableCell />
    <TableCell>{props.value.name}</TableCell>
    <TableCell className={clsOfStatename(props.value.statename)}>{props.value.statename}</TableCell>
    <TableCell>{props.value.description}</TableCell>
    <TableCell>
      <Switch
        checked={props.value.statename === "RUNNING"}
        onChange={(event) =>
          props.supervisor[event.target.checked ? "startProcess" : "stopProcess"](
            props.value.group,
            props.value.name
          ).then(props.setProcess)
        }
        size="small"
      />
      <Tooltip title="restart">
        <span>
          <IconButton
            color="primary"
            onClick={(e) => props.supervisor.restartProcess(props.value.group, props.value.name, props.setProcess)}
            disabled={props.value.statename !== "RUNNING"}
            size="small"
          >
            <Loop />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Clear Logs">
        <IconButton
          color="primary"
          onClick={(e) => props.supervisor.clearProcessLogs(props.value.group, props.value.name)}
          size="small"
        >
          <ClearAll />
        </IconButton>
      </Tooltip>
    </TableCell>
    <TableCell>
      <Link href={`logtail/${props.value.group}:${props.value.name}`}>stdout</Link>&nbsp;
      <Link href={`logtail/${props.value.group}:${props.value.name}/stderr`}>stderr</Link>
    </TableCell>
  </TableRow>
);

const Group = (props: {
  value: string;
  processes: IGroup;
  supervisor: Supervisor;
  setProcess: (process: IProcess | IProcess[]) => any;
}) => (
  <>
    <TableRow>
      <TableCell>{props.value}</TableCell>
      <TableCell />
      <TableCell />
      <TableCell />
      <TableCell>
        <Tooltip title="Start Group">
          <span>
            <IconButton
              color="primary"
              onClick={(e) =>
                props.supervisor
                  .stopProcessGroup(props.value)
                  .then((value) => Promise.all(value))
                  .then(props.setProcess)
              }
              disabled={Object.values(props.processes).reduce<boolean>(
                (acc, cur) => acc && cur.statename !== "RUNNING",
                true
              )}
              size="small"
            >
              <Stop />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Stop Group">
          <span>
            <IconButton
              color="primary"
              onClick={(e) =>
                props.supervisor
                  .startProcessGroup(props.value)
                  .then((value) => Promise.all(value))
                  .then(props.setProcess)
              }
              disabled={Object.values(props.processes).reduce<boolean>(
                (acc, cur) => acc && cur.statename === "RUNNING",
                true
              )}
              size="small"
            >
              <PlayArrow />
            </IconButton>
          </span>
        </Tooltip>
      </TableCell>
      <TableCell />
    </TableRow>
    {Object.entries(props.processes).map(([name, process]) => (
      <Process key={name} value={process} supervisor={props.supervisor} setProcess={props.setProcess} />
    ))}
  </>
);

const About = (props: { supervisor: Supervisor }) => {
  const [version, setVersion] = useState("?");
  const [state, setState] = useState("?");

  useEffect(() => {
    props.supervisor.getState().then(setState);
    props.supervisor.getSupervisorVersion().then(setVersion);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <DialogContent>
      <DialogTitle>Supervisor-React</DialogTitle>
      <DialogContentText>
        With Supervisor {version}, State: {state}
      </DialogContentText>
    </DialogContent>
  );
};

const App = () => {
  const [processes, setProcesses] = useState<IProcesses>({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);
  const supervisor = new Supervisor();

  useEffect(() => {
    supervisor.getAllProcessInfo().then(setProcesses);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setProcess = (process: IProcess | IProcess[]) => {
    const newp = Object.entries(processes).reduce((acc: IProcesses, [name, group]) => {
      acc[name] = group;
      return acc;
    }, {});
    if (Array.isArray(process)) {
      process.reduce((acc, cur) => {
        acc[cur.group][cur.name] = cur;
        return acc;
      }, newp);
    } else {
      newp[process.group][process.name] = process;
    }
    setProcesses(newp);
  };

  const handleMenu = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOpenAbout = () => {
    handleClose();
    setOpen(true);
  };

  const handleCloseAbout = () => {
    setOpen(false);
  };

  return (
    <>
      <CssBaseline />
      <Container fixed>
        <Dialog open={open} onClose={handleCloseAbout}>
          <About supervisor={supervisor} />
        </Dialog>
        <AppBar position="static">
          <Toolbar>
            <IconButton onClick={handleMenu} color="inherit">
              <MenuIcon />
            </IconButton>
            <Menu open={anchorEl !== null} onClose={handleClose} anchorEl={anchorEl}>
              <MenuItem
                onClick={(e) => {
                  handleClose();
                  supervisor
                    .stopAllProcesses()
                    .then((value) => Promise.all(value))
                    .then(setProcess);
                }}
                disabled={Object.values(processes).reduce<boolean>(
                  (acc0, group) =>
                    acc0 &&
                    Object.values(group).reduce<boolean>(
                      (acc1, process) => acc1 && process.statename !== "RUNNING",
                      true
                    ),
                  true
                )}
              >
                Stop all
              </MenuItem>
              <MenuItem
                onClick={(e) => {
                  handleClose();
                  supervisor
                    .startAllProcesses()
                    .then((value) => Promise.all(value))
                    .then(setProcess);
                }}
                disabled={Object.values(processes).reduce<boolean>(
                  (acc0, group) =>
                    acc0 &&
                    Object.values(group).reduce<boolean>(
                      (acc1, process) => acc1 && process.statename === "RUNNING",
                      true
                    ),
                  true
                )}
              >
                Start All
              </MenuItem>
              <MenuItem
                onClick={(e) => {
                  handleClose();
                  supervisor.restartAllProcesses(setProcess);
                }}
              >
                Restart All
              </MenuItem>
              <MenuItem
                onClick={(e) => {
                  handleClose();
                  supervisor.clearAllProcessLogs();
                }}
              >
                Clear All
              </MenuItem>

              <MenuItem onClick={handleOpenAbout}>About</MenuItem>
            </Menu>
            <Typography variant="h6" style={{ flexGrow: 1 }}>
              Supervisor
            </Typography>
            <Tooltip title="Reload Supervisor">
              <span>
                <IconButton
                  color="inherit"
                  onClick={(e) => supervisor.getAllProcessInfo().then(setProcesses)}
                  size="small"
                >
                  <Replay />
                </IconButton>
              </span>
            </Tooltip>
          </Toolbar>
        </AppBar>
        <TableContainer component={Paper}>
          <Table className="sr-cell" size="small">
            <TableHead>
              <TableRow>
                <TableCell>Group</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>State</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Actions</TableCell>
                <TableCell>Logs</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(processes).map(([group, processes]) => (
                <Group
                  key={group}
                  value={group}
                  processes={processes}
                  supervisor={supervisor}
                  setProcess={setProcess}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </>
  );
};

export default App;
