import React, { useEffect, useState } from "react";

import { withStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Box from "@material-ui/core/Box";
import Container from "@material-ui/core/Container";
import CssBaseline from "@material-ui/core/CssBaseline";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import IconButton from "@material-ui/core/IconButton";
import Link from "@material-ui/core/Link";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import Paper from "@material-ui/core/Paper";
import Switch from "@material-ui/core/Switch";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableRow from "@material-ui/core/TableRow";
import Toolbar from "@material-ui/core/Toolbar";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import Dialog from "@material-ui/core/Dialog";

import clsx from "clsx";

import CheckIcon from "@material-ui/icons/Check";
import CloseIcon from "@material-ui/icons/Close";
import LoopIcon from "@material-ui/icons/Loop";
import MenuIcon from "@material-ui/icons/Menu";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import ReplayIcon from "@material-ui/icons/Replay";
import StopIcon from "@material-ui/icons/Stop";

import _ from "lodash";

import { ProcessInfo, ProcessStates, RUNNING_STATES, Supervisor } from "./supervisor";

const TooltipIconButton = (props: any) => {
  const { title, ...rest } = props;
  return (
    <Tooltip title={title}>
      <Box component="span">
        <IconButton {...rest} />
      </Box>
    </Tooltip>
  );
};

const AboutDialog = (props: any) => {
  const { supervisor, ...rest } = props;
  const [version, setVersion] = useState("");

  useEffect(() => {
    supervisor.getSupervisorVersion().then(setVersion);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog {...rest}>
      <DialogTitle>About</DialogTitle>
      <DialogContent dividers>
        <ul>
          <li>supervisor: {version}</li>
          <li>supervisor-react: 0.1.3</li>
        </ul>
      </DialogContent>
    </Dialog>
  );
};
const FlexTitle = withStyles({ root: { flexGrow: 1 } })(Typography);

const SupervisorAppBar = ({ supervisor }: { supervisor: Supervisor }) => {
  const [anchorEl, setAnchorEl] = useState(null as (EventTarget & HTMLButtonElement) | null);
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <MenuIcon />
          </IconButton>
          <Menu anchorEl={anchorEl} open={anchorEl !== null} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={(_e) => supervisor.stopAllProcesses()}>Stop all</MenuItem>
            <MenuItem onClick={(_e) => supervisor.startAllProcesses()}>Start All</MenuItem>
            <MenuItem onClick={(_e) => supervisor.restartAllProcesses()}>Restart All</MenuItem>
            <MenuItem onClick={(_e) => supervisor.clearAllProcessLogs()}>Clear All</MenuItem>
            <MenuItem
              onClick={(_e) => {
                setAnchorEl(null);
                setOpen(true);
              }}
            >
              About
            </MenuItem>
          </Menu>
          <FlexTitle variant="h5">Supervisor</FlexTitle>
          <Tooltip title="Reload Supervisor">
            <IconButton color="inherit" onClick={(e) => supervisor.getAllProcessInfo()}>
              <ReplayIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <AboutDialog supervisor={supervisor} open={open} onClose={() => setOpen(false)} />
    </>
  );
};

const ExpansionPanelSummary2 = withStyles({
  root: {
    minHeight: 45,
    padding: 0,

    "&$expanded": {
      margin: 0,
      minHeight: 45,
    },
  },
  content: {
    margin: 0,
    minHeight: 45,
    "&$expanded": {
      margin: 0,
    },
  },
  expanded: {},
})(ExpansionPanelSummary);

const SummaryRow = withStyles({
  root: {
    "& td:nth-child(1)": {
      width: 140,
    },
    "& td:nth-child(2)": {
      width: 140,
    },
    "& td:nth-child(3)": {
      textAlign: "center",
      width: 113,
    },
    "& td:nth-child(5)": {
      width: 132,
    },
    "& td:nth-child(6)": {
      width: 113,
    },
  },
})(TableRow);

const GroupState = withStyles(({ palette }) => ({
  all: { color: palette.success.main },
  some: { color: palette.success.light },
  none: { color: palette.warning.light },
}))(({ running, length, classes }: { running: number; length: number; classes: any }) => (
  <Box component="span" className={running === length ? classes.all : running === 0 ? classes.none : classes.some}>
    {running}/{length}
  </Box>
));

const ProcessRunning = withStyles(({ palette }) => ({
  root: {
    color: palette.success.main,
  },
}))(CheckIcon);

const ProcessFatal = withStyles(({ palette }) => ({
  root: {
    color: palette.error.main,
  },
}))(CloseIcon);

const ProcessStopped = withStyles(({ palette }) => ({
  root: {
    color: palette.warning.main,
  },
}))(CloseIcon);

const ProcessIcon = ({ process, supervisor }: { process: ProcessInfo; supervisor: Supervisor }) => {
  const onClick = RUNNING_STATES.includes(process.state) ? supervisor.stopProcess : supervisor.startProcess;
  return (
    <Tooltip title={process.name}>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onClick(process);
        }}
      >
        {RUNNING_STATES.includes(process.state) ? (
          <ProcessRunning />
        ) : process.state === ProcessStates.FATAL ? (
          <ProcessFatal />
        ) : (
          <ProcessStopped />
        )}
      </IconButton>
    </Tooltip>
  );
};

const GroupSummary = ({
  value,
  processes,
  supervisor,
}: {
  value: string;
  processes: ProcessInfo[];
  supervisor: Supervisor;
}) => {
  const byState = _.assign(
    { RUNNING: 0, STOPPED: 0 },
    _.countBy(processes, (e) => (RUNNING_STATES.includes(e.state) ? "RUNNING" : "STOPPED"))
  );

  return (
    <ExpansionPanelSummary2>
      <TableContainer component={Paper} elevation={0}>
        <Table size="small">
          <TableBody>
            <SummaryRow>
              <TableCell>{value}</TableCell>
              <TableCell></TableCell>
              <TableCell>
                <GroupState running={byState.RUNNING} length={processes.length} />
              </TableCell>
              <TableCell>
                {processes.map((process) => (
                  <ProcessIcon key={process.name} process={process} supervisor={supervisor} />
                ))}
              </TableCell>
              <TableCell padding="none">
                <TooltipIconButton
                  title="Stop Group"
                  color="primary"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    supervisor.stopProcessGroup(value);
                  }}
                  disabled={byState.RUNNING === 0}
                >
                  <StopIcon fontSize="small" />
                </TooltipIconButton>
                <TooltipIconButton
                  title="Start"
                  color="primary"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    supervisor.startProcessGroup(value);
                  }}
                  disabled={byState.RUNNING === processes.length}
                >
                  <PlayArrowIcon fontSize="small" />
                </TooltipIconButton>
                <TooltipIconButton
                  title="Restart"
                  color="primary"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    supervisor.restartProcessGroup(value);
                  }}
                >
                  <LoopIcon fontSize="small" />
                </TooltipIconButton>
              </TableCell>
              <TableCell></TableCell>
            </SummaryRow>
          </TableBody>
        </Table>
      </TableContainer>
    </ExpansionPanelSummary2>
  );
};

const State = withStyles(({ palette }) => ({
  root: {
    borderRadius: 6,
    color: palette.error.contrastText,
    padding: "2px 4px",
  },
  running: {
    backgroundColor: palette.success.main,
  },
  stopped: {
    backgroundColor: palette.warning.light,
  },
  fatal: {
    backgroundColor: palette.error.main,
  },
}))(({ process, classes }: { process: ProcessInfo; classes: any }) => (
  <Box
    component="span"
    className={clsx(
      classes.root,
      RUNNING_STATES.includes(process.state)
        ? classes.running
        : (process.state !== ProcessStates.FATAL
        ? classes.stopped
        : classes.fatal)
    )}
  >
    {process.statename}
  </Box>
));

const DetailRow = withStyles({
  root: {
    "& td:nth-child(1)": {
      width: 140,
    },
    "& td:nth-child(2)": {
      width: 140,
    },
    "& td:nth-child(3)": {
      width: 113,
    },
    "& td:nth-child(5)": {
      width: 132,
    },
    "& td:nth-child(6)": {
      width: 113,
    },
  },
})(TableRow);

const SwitchWrapper = withStyles({
  root: {
    display: "inline-block",
    textAlign: "center",
    width: 88,
  },
})(Box);

//const State = (props: { process: ProcessInfo }) => <Box component="span">{props.process.statename}</Box>;
const ProcessDetail = (props: { process: ProcessInfo; supervisor: Supervisor }) => {
  const process = props.process;

  return (
    <DetailRow>
      <TableCell></TableCell>
      <TableCell>{process.name}</TableCell>
      <TableCell padding="none" align="center">
        <State {...props} />
      </TableCell>
      <TableCell>{process.description}</TableCell>
      <TableCell padding="none">
        <SwitchWrapper component="span">
          <Switch
            size="small"
            checked={RUNNING_STATES.includes(process.state)}
            onChange={(e) =>
              (RUNNING_STATES.includes(process.state) ? props.supervisor.stopProcess : props.supervisor.startProcess)(
                process
              )
            }
          />
        </SwitchWrapper>
        <TooltipIconButton
          title="Restart"
          color="primary"
          onClick={(e: any) => props.supervisor.restartProcess(process)}
        >
          <LoopIcon fontSize="small" />
        </TooltipIconButton>
      </TableCell>
      <TableCell>
        <Link href={`logtail/${process.group}:${process.name}`}>stdout</Link>
        &nbsp;
        <Link href={`logtail/${process.group}:${process.name}/stderr`}>stderr</Link>
      </TableCell>
    </DetailRow>
  );
};

const ExpansionPanelDetails2 = withStyles({
  root: {
    padding: 0,
  },
})(ExpansionPanelDetails);

const GroupDetails = (props: { processes: ProcessInfo[]; supervisor: Supervisor }) => (
  <ExpansionPanelDetails2>
    <TableContainer>
      <Table size="small">
        <TableBody>
          {props.processes.map((process) => (
            <ProcessDetail key={process.name} process={process} {...props} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </ExpansionPanelDetails2>
);

const ExpansionPanel2 = withStyles({
  root: {
    "&$expanded": {
      margin: 0,
    },
    backgroundColor: "unset",
  },
  expanded: {},
})(ExpansionPanel);

const Group = (props: { value: string; processes: ProcessInfo[]; supervisor: Supervisor }) => {
  return (
    <ExpansionPanel2 elevation={0}>
      <GroupSummary {...props} />
      <GroupDetails {...props} />
    </ExpansionPanel2>
  );
};

const App = () => {
  const [processes, setProcesses] = useState([] as ProcessInfo[]);
  const supervisor = new Supervisor(setProcesses);

  useEffect(() => {
    supervisor.getAllProcessInfo();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <CssBaseline />
      <Container fixed>
        <SupervisorAppBar supervisor={supervisor} />
        {_(processes)
          .groupBy("group")
          .toPairs()
          .sortBy()
          .map(([group, processes]) => (
            <Group key={group} value={group} processes={_.sortBy(processes, "name")} supervisor={supervisor} />
          ))
          .value()}
      </Container>
    </>
  );
};

export default App;
