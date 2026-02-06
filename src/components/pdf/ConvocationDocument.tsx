import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { type DiagnosticResult } from '@/lib/schemas';
import { formatCurrency } from '@/lib/calculator';

// Reuse fonts registration
Font.register({
    family: 'Playfair Display',
    src: 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.ttf'
});

Font.register({
    family: 'Inter',
    src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.ttf'
});

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Inter',
        fontSize: 11,
        lineHeight: 1.5,
    },
    header: {
        borderBottomWidth: 1,
        borderBottomColor: '#050505',
        paddingBottom: 20,
        marginBottom: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    brandTitle: {
        fontSize: 18,
        fontFamily: 'Playfair Display',
        color: '#050505',
        fontWeight: 'bold',
    },
    title: {
        fontSize: 22,
        fontFamily: 'Playfair Display',
        color: '#050505',
        marginBottom: 10,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 12,
        color: '#52525b',
        marginBottom: 30,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: 'Playfair Display',
        color: '#050505',
        marginBottom: 8,
        fontWeight: 'bold',
        textDecoration: 'underline',
    },
    p: {
        marginBottom: 10,
        textAlign: 'justify',
    },
    bullet: {
        marginLeft: 20,
        marginBottom: 5,
    },
    resolutionBox: {
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#050505',
        padding: 15,
        backgroundColor: '#F3F4F6',
    },
    resolutionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    signature: {
        marginTop: 50,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        fontSize: 9,
        color: '#9CA3AF',
        textAlign: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 10,
    },
});

import { type BrandSettings } from "@/stores/useBrandStore";

interface ConvocationDocumentProps {
    result: DiagnosticResult;
    brand?: BrandSettings;
}

export const ConvocationDocument = ({ result, brand }: ConvocationDocumentProps) => {
    const agencyName = brand?.agencyName || "VALO SYNDIC";
    const primaryColor = brand?.primaryColor || "#050505";

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: primaryColor }]}>
                    <View>
                        {brand?.logoUrl ? (
                            // @ts-ignore
                            <Image src={brand.logoUrl} style={{ width: 100, height: 40, objectFit: 'contain' }} alt="Logo Agence" />
                        ) : (
                            <Text style={[styles.brandTitle, { color: primaryColor }]}>{agencyName}</Text>
                        )}
                    </View>
                    <Text style={{ fontSize: 10 }}>Projet de Résolution — AG 2026</Text>
                </View>

                <Text style={styles.title}>PROJET DE RÉSOLUTION</Text>
                <Text style={styles.subtitle}>Rénovation Énergétique & Valorisation Patrimoniale</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. CONTEXTE ET OBLIGATIONS</Text>
                    <Text style={styles.p}>
                        La copropriété située au {result.input.address},
                        est actuellement classée en étiquette énergétique <Text style={{ fontWeight: 'bold' }}>{result.input.currentDPE}</Text>.
                    </Text>
                    <Text style={styles.p}>
                        Conformément à la Loi Climat & Résilience, ce classement entraîne des restrictions progressives (interdiction de location, gel des loyers)
                        et une perte de valeur patrimoniale estimée à ce jour.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. LE PROJET DE RÉNOVATION</Text>
                    <Text style={styles.p}>
                        L&apos;audit flash réalisé permet d&apos;envisager un scénario atteignant l&apos;étiquette <Text style={{ fontWeight: 'bold', color: '#16a34a' }}>{result.input.targetDPE}</Text>.
                    </Text>
                    <Text style={styles.bullet}>• Coût global estimé : {formatCurrency(result.financing.totalCostHT)} HT</Text>
                    <Text style={styles.bullet}>• Aides mobilisables (MaPrimeRénov&apos;) : {formatCurrency(result.financing.mprAmount)}</Text>
                    <Text style={styles.bullet}>• Reste à charge moyen : {formatCurrency(result.financing.remainingCostPerUnit)} par lot</Text>
                </View>

                <View style={styles.resolutionBox}>
                    <Text style={styles.resolutionTitle}>TEXTE DE LA RÉSOLUTION À SOUMETTRE AU VOTE</Text>
                    <Text style={styles.p}>
                        &quot;L&apos;Assemblée Générale, après avoir pris connaissance de l&apos;audit énergétique simplifié et des enjeux financiers liés à la rénovation énergétique du bâtiment :
                    </Text>
                    <Text style={styles.bullet}>
                        1. <Text style={{ fontWeight: 'bold' }}>Valide le principe</Text> d&apos;engager la copropriété dans une démarche de rénovation énergétique globale visant l&apos;étiquette cible.
                    </Text>
                    <Text style={styles.bullet}>
                        2. <Text style={{ fontWeight: 'bold' }}>Donne mandat au syndic</Text> pour solliciter des propositions d&apos;honoraires auprès de maîtres d&apos;œuvre spécialisés (Architectes / Bureaux d&apos;Études) afin de concevoir le projet définitif.
                    </Text>
                    <Text style={styles.bullet}>
                        3. <Text style={{ fontWeight: 'bold' }}>Décide</Text> que ces propositions seront soumises à la prochaine Assemblée Générale pour vote du maître d&apos;œuvre.&quot;
                    </Text>
                </View>

                <View style={styles.signature}>
                    <Text style={{ fontSize: 10, fontStyle: 'italic' }}>Document généré par {agencyName}</Text>
                </View>

                <Text style={styles.footer}>
                    Ce document est une aide à la décision. Les montants sont donnés à titre indicatif selon les règles en vigueur en 2026.
                </Text>
            </Page>
        </Document>
    );
};
