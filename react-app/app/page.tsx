'use client'

import React, { useEffect, useState } from "react";

import _ from "lodash";

import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import CssBaseline from "@mui/material/CssBaseline";
import Dialog, { DialogProps } from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton, { IconButtonProps } from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { version as MuiVersion } from "@mui/material/version";

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import LoopIcon from "@mui/icons-material/Loop";
import MenuIcon from "@mui/icons-material/Menu";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ReplayIcon from "@mui/icons-material/Replay";
import StopIcon from "@mui/icons-material/Stop";

import { ProcessInfo, ProcessStates, RUNNING_STATES, Supervisor } from "./supervisor";

const TooltipIconButton = (props: { title: string } & IconButtonProps) => {
  const { title, ...rest } = props;
  return (
    <Tooltip title={title}>
      <Box component="span">
        <IconButton {...rest} />
      </Box>
    </Tooltip>
  );
};

const AboutDialog = (props: { supervisor: Supervisor } & DialogProps) => {
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
          <li>supervisor-react: 0.7.0</li>
          <li>supervisor: {version}</li>
          <li>react: {React.version}</li>
          <li>mui: {MuiVersion}</li>
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
            <IconButton color="inherit" onClick={(_e) => supervisor.getAllProcessInfo()}>
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
    { RUNNING: 0, STOPPED: 0, FATAL: 0 },
    _.countBy(processes, (e) =>
      RUNNING_STATES.includes(e.state) ? "RUNNING" : e.state === ProcessStates.FATAL ? "FATAL" : "STOPPED"
    )
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
                      byState.FATAL > 0
                        ? "error.main"
                        : byState.RUNNING === processes.length
                          ? "success.main"
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
                  onClick={(e) => {
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
                  onClick={(e) => {
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
                  onClick={(e) => {
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
          onClick={(_e) => props.supervisor.restartProcess(process)}
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

export default function Home() {
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
}
