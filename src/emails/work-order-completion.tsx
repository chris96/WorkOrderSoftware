import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type WorkOrderCompletionEmailProps = {
  closeoutDateLabel: string;
  repairSummary: string;
  reportUrl: string;
  tenantName: string;
  unitNumber: string;
  workOrderId: string;
};

export function WorkOrderCompletionEmail({
  closeoutDateLabel,
  repairSummary,
  reportUrl,
  tenantName,
  unitNumber,
  workOrderId,
}: WorkOrderCompletionEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your repair request has been completed</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={eyebrow}>WORK ORDER COMPLETE</Text>
          <Heading style={heading}>Your maintenance request has been completed.</Heading>
          <Text style={paragraph}>Hello {tenantName},</Text>
          <Text style={paragraph}>
            The repair request for unit {unitNumber} has been closed out. A repair
            report is ready for review.
          </Text>

          <Section style={panel}>
            <Text style={label}>Work order</Text>
            <Text style={value}>{workOrderId}</Text>

            <Text style={label}>Completed</Text>
            <Text style={value}>{closeoutDateLabel}</Text>

            <Text style={label}>Repair summary</Text>
            <Text style={value}>{repairSummary}</Text>
          </Section>

          <Button href={reportUrl} style={button}>
            Open repair report
          </Button>

          <Text style={footnote}>
            This secure report link is intended for the tenant on this request.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#111111",
  color: "#f5f5f4",
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  margin: 0,
  padding: "32px 16px",
};

const container = {
  backgroundColor: "#1c1917",
  border: "1px solid #44403c",
  borderRadius: "24px",
  margin: "0 auto",
  maxWidth: "640px",
  padding: "32px",
};

const eyebrow = {
  color: "#fcd34d",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "0.3em",
  margin: "0 0 16px",
};

const heading = {
  color: "#fafaf9",
  fontSize: "30px",
  fontWeight: "700",
  letterSpacing: "-0.03em",
  lineHeight: "1.1",
  margin: "0 0 20px",
};

const paragraph = {
  color: "#d6d3d1",
  fontSize: "16px",
  lineHeight: "1.8",
  margin: "0 0 16px",
};

const panel = {
  backgroundColor: "#0c0a09",
  border: "1px solid #292524",
  borderRadius: "20px",
  margin: "24px 0",
  padding: "24px",
};

const label = {
  color: "#a8a29e",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "0.18em",
  margin: "0 0 6px",
  textTransform: "uppercase" as const,
};

const value = {
  color: "#fafaf9",
  fontSize: "15px",
  lineHeight: "1.7",
  margin: "0 0 16px",
};

const button = {
  backgroundColor: "#fcd34d",
  borderRadius: "999px",
  color: "#1c1917",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: "700",
  padding: "14px 22px",
  textDecoration: "none",
};

const footnote = {
  color: "#a8a29e",
  fontSize: "13px",
  lineHeight: "1.7",
  margin: "20px 0 0",
};
