import * as React from 'react';
import { Text, View, StyleSheet } from 'react-native';

function HomeScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.welcomeText}>Bem-vindo ao App de Jogos</Text>
            <Text style={styles.instructionText}>
                Utilize a navegação abaixo para gerenciar seus jogos
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        textAlign: 'center',
    },
    instructionText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    }
});

export default HomeScreen;