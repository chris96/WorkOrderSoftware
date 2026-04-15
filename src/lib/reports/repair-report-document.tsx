/* eslint-disable jsx-a11y/alt-text */

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type { RepairReportPayload } from "@/lib/reports/get-repair-report-payload";

const styles = StyleSheet.create({
  bodyText: {
    color: "#292524",
    fontSize: 11,
    lineHeight: 1.6,
  },
  card: {
    backgroundColor: "#f5f5f4",
    borderRadius: 10,
    marginBottom: 14,
    padding: 14,
  },
  grid: {
    display: "flex",
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  gridItem: {
    backgroundColor: "#f5f5f4",
    borderRadius: 10,
    flexGrow: 1,
    padding: 14,
  },
  heading: {
    color: "#0c0a09",
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 8,
  },
  label: {
    color: "#57534e",
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  page: {
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    padding: 32,
  },
  pageTitle: {
    color: "#0c0a09",
    fontSize: 24,
    fontWeight: 700,
  },
  photo: {
    borderRadius: 8,
    height: 180,
    marginTop: 8,
    objectFit: "cover",
    width: "100%",
  },
  photoCard: {
    backgroundColor: "#f5f5f4",
    borderRadius: 10,
    marginBottom: 12,
    padding: 12,
  },
  subtle: {
    color: "#78716c",
    fontSize: 10,
    lineHeight: 1.5,
  },
  subtitle: {
    color: "#a16207",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  value: {
    color: "#0c0a09",
    fontSize: 12,
    fontWeight: 600,
  },
});

export function RepairReportDocument({
  payload,
}: {
  payload: RepairReportPayload;
}) {
  return (
    <Document
      author="Work Order System"
      title={`Repair Report ${payload.workOrderId}`}
      subject="Completed repair report"
    >
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.subtitle}>Repair report</Text>
        <Text style={styles.pageTitle}>Completed maintenance work</Text>
        <Text style={[styles.subtle, { marginTop: 8, marginBottom: 18 }]}>
          Work order {payload.workOrderId}
        </Text>

        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Tenant</Text>
            <Text style={styles.value}>{payload.tenant.name}</Text>
            <Text style={styles.bodyText}>{payload.tenant.email}</Text>
            <Text style={styles.bodyText}>
              {payload.tenant.phone || "No phone provided"}
            </Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Request summary</Text>
            <Text style={styles.value}>Unit {payload.unitNumber}</Text>
            <Text style={styles.bodyText}>{payload.originalRequest.category}</Text>
            <Text style={styles.bodyText}>{payload.emergencyLabel}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>Original request</Text>
          <Text style={styles.subtle}>
            Submitted {payload.originalRequest.submittedAtLabel}
          </Text>
          <Text style={[styles.bodyText, { marginTop: 8 }]}>
            {payload.originalRequest.description}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>Repair completion</Text>
          <Text style={styles.subtle}>Closed {payload.closeoutDateLabel}</Text>
          <Text style={[styles.bodyText, { marginTop: 8 }]}>
            {payload.repairSummary}
          </Text>
          <Text style={[styles.bodyText, { marginTop: 10 }]}>
            Materials used: {payload.materialsUsed || "None recorded"}
          </Text>
          <Text style={[styles.bodyText, { marginTop: 4 }]}>
            Closed by: {payload.closedByName || "Staff user not recorded"}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>Closeout photos</Text>
          {payload.closeoutPhotos.length === 0 ? (
            <Text style={styles.bodyText}>No closeout photos were attached.</Text>
          ) : (
            payload.closeoutPhotos.map((photo) => (
              <View key={`${photo.label}-${photo.createdAt}`} style={styles.photoCard}>
                <Text style={styles.value}>{photo.label}</Text>
                <Text style={styles.subtle}>
                  Added {photo.createdAt}
                </Text>
                {photo.signedUrl ? (
                  <Image src={photo.signedUrl} style={styles.photo} />
                ) : (
                  <Text style={[styles.bodyText, { marginTop: 8 }]}>
                    Photo preview unavailable for this report generation.
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </Page>
    </Document>
  );
}
