import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    padding: 60,
    fontFamily: "Helvetica",
  },
  border: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderWidth: 3,
    borderColor: "#4f46e5",
    borderStyle: "solid",
    borderRadius: 8,
  },
  innerBorder: {
    position: "absolute",
    top: 28,
    left: 28,
    right: 28,
    bottom: 28,
    borderWidth: 1,
    borderColor: "#a5b4fc",
    borderStyle: "solid",
    borderRadius: 6,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  brandBadge: {
    backgroundColor: "#4f46e5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 8,
  },
  brandText: {
    color: "#ffffff",
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
  },
  titleSmall: {
    fontSize: 13,
    color: "#64748b",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  certTitle: {
    fontSize: 36,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
    marginTop: 6,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: "#4f46e5",
    marginVertical: 14,
    borderRadius: 2,
  },
  body: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 1.6,
  },
  nameText: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#4f46e5",
    marginVertical: 8,
  },
  topicText: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
    marginTop: 4,
  },
  dateText: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 16,
  },
  footer: {
    position: "absolute",
    bottom: 50,
    left: 60,
    right: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  signatureBox: {
    alignItems: "center",
    gap: 4,
  },
  signatureLine: {
    width: 120,
    height: 1,
    backgroundColor: "#cbd5e1",
  },
  signatureLabel: {
    fontSize: 9,
    color: "#94a3b8",
    marginTop: 4,
  },
});

interface CertificateProps {
  userName: string;
  topic: string;
  completedDate: string;
}

export function CertificatePdfDocument({ userName, topic, completedDate }: CertificateProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border} />
        <View style={styles.innerBorder} />

        <View style={styles.content}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandText}>RESUMEBOOST</Text>
          </View>

          <Text style={styles.titleSmall}>Certificate of Completion</Text>
          <View style={styles.divider} />

          <Text style={styles.body}>This certifies that</Text>
          <Text style={styles.nameText}>{userName}</Text>
          <Text style={styles.body}>has successfully completed the learning roadmap for</Text>
          <Text style={styles.topicText}>{topic}</Text>

          <Text style={styles.dateText}>Completed on {completedDate}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Participant Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>ResumeBoost AI Platform</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
