import { Component } from "react";
import Typography from "@mui/material/Typography";

/** Keeps the login/register chrome up if Clerk's widget throws (e.g. localhost + pk_live). */
export default class ClerkWidgetBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2, textAlign: "center" }}
        >
          Sign-in could not load. Refresh the page.
        </Typography>
      );
    }
    return this.props.children;
  }
}
