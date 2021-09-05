import { useEffect, useState } from "react";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import _ from "lodash";

import AppBar from "@material-ui/core/AppBar";
import Box from "@material-ui/core/Box";
import CheckIcon from "@material-ui/icons/Check";
import CloseIcon from "@material-ui/icons/Close";
import Container from "@material-ui/core/Container";
import CssBaseline from "@material-ui/core/CssBaseline";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Accordion from "@material-ui/core/Accordion";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import IconButton from "@material-ui/core/IconButton";
import Link from "@material-ui/core/Link";
import LoopIcon from "@material-ui/icons/Loop";
import Menu from "@material-ui/core/Menu";
import MenuIcon from "@material-ui/icons/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import Paper from "@material-ui/core/Paper";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import ReplayIcon from "@material-ui/icons/Replay";
import StopIcon from "@material-ui/icons/Stop";
import Switch from "@material-ui/core/Switch";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableRow from "@material-ui/core/TableRow";
import Toolbar from "@material-ui/core/Toolbar";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

const SupervisorAppBar = ({ supervisor }: { supervisor: Supervisor }) => {
  const [anchorEl, setAnchorEl] = useState(null as (EventTarget & HTMLButtonElement) | null);
  const [open, setOpen] = useState(false);

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
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            Supervisor
          </Typography>
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
          <CheckIcon sx={{ color: "success.main" }} />
        ) : process.state === ProcessStates.FATAL ? (
          <CloseIcon sx={{ color: "error.main" }} />
        ) : (
          <CloseIcon sx={{ color: "warning.main" }} />
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
    <AccordionSummary
      sx={{
        "&.Mui-expanded": {
          minHeight: 0,
        },
        "& .MuiAccordionSummary-content": {
          margin: 0,
        },
        "& .MuiAccordionSummary-content.Mui-expanded": {
          margin: 0,
        },
      }}
    >
      <TableContainer component={Paper} elevation={0}>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell width={200}>{value}</TableCell>
              <TableCell width={120}></TableCell>
              <TableCell align="center" width={73}>
                <Box
                  component="span"
                  sx={{
                    color:
                      byState.RUNNING === processes.length
                        ? "success.main"
                        : byState.RUNNING === 0
                        ? "error.main"
                        : "warning.main",
                  }}
                >
                  {byState.RUNNING}/{processes.length}
                </Box>
              </TableCell>
              <TableCell>
                {processes.map((process) => (
                  <ProcessIcon key={process.name} process={process} supervisor={supervisor} />
                ))}
              </TableCell>
              <TableCell padding="none" width={132}>
                <TooltipIconButton
                  size="small"
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
                  size="small"
                  title="Start Group"
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
                  size="small"
                  title="Restart Group"
                  color="primary"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    supervisor.restartProcessGroup(value);
                  }}
                >
                  <LoopIcon fontSize="small" />
                </TooltipIconButton>
              </TableCell>
              <TableCell width={113}></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </AccordionSummary>
  );
};

const ProcessDetail = (props: { process: ProcessInfo; supervisor: Supervisor }) => {
  const process = props.process;

  return (
    <TableRow>
      <TableCell width={120}></TableCell>
      <TableCell width={200}>{process.name}</TableCell>
      <TableCell padding="none" align="center" width={73}>
        <Box
          component="span"
          color={
            RUNNING_STATES.includes(process.state)
              ? "success.main"
              : process.state === ProcessStates.FATAL
              ? "error.main"
              : "warning.main"
          }
        >
          {process.statename}
        </Box>
      </TableCell>
      <TableCell>{process.description}</TableCell>
      <TableCell padding="none" width={132}>
        <Box component="span">
          <Switch
            size="small"
            checked={RUNNING_STATES.includes(process.state)}
            onChange={(e) =>
              (RUNNING_STATES.includes(process.state) ? props.supervisor.stopProcess : props.supervisor.startProcess)(
                process
              )
            }
          />
        </Box>
        <TooltipIconButton
          size="small"
          title="Restart"
          color="primary"
          onClick={(e: any) => props.supervisor.restartProcess(process)}
        >
          <LoopIcon fontSize="small" />
        </TooltipIconButton>
      </TableCell>
      <TableCell width={113}>
        <Link href={`logtail/${process.group}:${process.name}`}>stdout</Link>
        &nbsp;
        <Link href={`logtail/${process.group}:${process.name}/stderr`}>stderr</Link>
      </TableCell>
    </TableRow>
  );
};

const GroupDetails = (props: { processes: ProcessInfo[]; supervisor: Supervisor }) => (
  <AccordionDetails sx={{ paddingTop: 0, paddingBottom: 0 }}>
    <TableContainer>
      <Table size="small">
        <TableBody>
          {props.processes.map((process) => (
            <ProcessDetail key={process.name} process={process} {...props} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </AccordionDetails>
);

const Group = (props: { value: string; processes: ProcessInfo[]; supervisor: Supervisor }) => {
  return (
    <Accordion
      elevation={0}
      sx={{
        "&.Mui-expanded": {
          margin: 0,
        },
      }}
    >
      <GroupSummary {...props} />
      <GroupDetails {...props} />
    </Accordion>
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
