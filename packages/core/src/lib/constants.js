/*
   NOTE:
   `SIGTERM` is used to cause a program termination. It is a way to politely ask a program to terminate.
             The program can either handle this signal, clean up resources and then exit, or it can ignore the signal.
   `SIGINT` and `SIGTERM` have default handlers on non-Windows platforms that resets the terminal mode
            before exiting with code 128 + signal number. If one of these signals has a listener installed,
            its default behaviour will be removed (node will no longer exit).
 */

const TERMINATION_SIGNAL = {
  SIGTERM: 'SIGTERM',
  SIGINT: 'SIGINT',
};

module.exports = {
  TERMINATION_SIGNAL,
};
