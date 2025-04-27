import { View, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Card, Text, TextInput } from "react-native-paper";
import React, { useState } from "react";

import { auth } from '../services/connectionFirebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import DevAutomateIcon from '../../assets/icon.png';

export default function Login({ changeStatus }) {
  const [type, setType] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  function validateEmail(email) {
    if (!email) {
      setEmailError("Email é obrigatório");
      return false;
    }
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!re.test(email)) {
      setEmailError("Email inválido");
      return false;
    }
    return true;
  }

  function validatePassword(password) {
    const specialChars = /[!@#$%^&*(),.?":{}|<>]/;
    const upperCase = /[A-Z]/;
    const lowerCase = /[a-z]/;
    const numbers = /[0-9]/;

    if (!specialChars.test(password)) {
      setPasswordError("A senha deve conter pelo menos um caractere especial");
      return false;
    }
    if (!upperCase.test(password)) {
      setPasswordError("A senha deve conter pelo menos uma letra maiúscula");
      return false;
    }
    if (!lowerCase.test(password)) {
      setPasswordError("A senha deve conter pelo menos uma letra minúscula");
      return false;
    }
    if (!numbers.test(password)) {
      setPasswordError("A senha deve conter pelo menos um número");
      return false;
    }
    if (password.length < 6) {
      setPasswordError("A senha deve ter pelo menos 6 caracteres");
      return false;
    }
    return true;
  }

  function handleLogin() {
    if (!validateEmail(email)) {
      return;
    }

    if (!validatePassword(password)) {
      return;
    }

    if (type === 'login') {
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          changeStatus(userCredential.user.uid);
        })
        .catch((err) => {
          console.log(err.code);
          switch (err.code) {
            case 'auth/invalid-credential':
              alert('Email ou senha incorretos!');
              break;
            case 'auth/user-not-found':
              setEmailError("Email não cadastrado");
              break;
            case 'auth/too-many-requests':
              alert('Muitas tentativas incorretas. Por favor, tente novamente mais tarde.');
              break;
            default:
              alert('Erro ao fazer login. Por favor, tente novamente.');
          }
        });
    } else {
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          changeStatus(userCredential.user.uid);
        })
        .catch((err) => {
          console.log(err.code);
          switch (err.code) {
            case 'auth/email-already-in-use':
              setEmailError("Este email já está cadastrado");
              break;
            case 'auth/weak-password':
              setPasswordError("Senha muito fraca");
              break;
            default:
              alert('Erro ao cadastrar. Por favor, tente novamente.');
          }
        });
    }
  }

  return (
    <View style={styles.container}>
      <Image style={styles.logo} source={DevAutomateIcon} />
      <Card>
        <Card.Title title="" subtitle="" />
        <Card.Content>
          <Text variant="bodyMedium"></Text>
          <TextInput
            style={styles.label}
            mode="outlined"
            label="E-mail"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError("");
            }}
            error={!!emailError}
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          <TextInput
            style={styles.label}
            mode="outlined"
            label="Senha acima de 6 caracteres"
            secureTextEntry
            maxLength={30}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError("");
            }}
            error={!!passwordError}
          />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </Card.Content>
      </Card>
      <TouchableOpacity
        style={[
          styles.colorButton,
          { backgroundColor: type === 'login' ? '#4682B4' : '#FF0000' },
        ]}
        onPress={handleLogin}>
        <Text style={styles.loginText}>
          {type === 'login' ? 'Acessar' : 'Cadastrar'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          setType((type) => (type === 'login' ? 'cadastrar' : 'login'))
        }>
        <Text style={styles.switchText}>
          {type === 'login' ? 'Criar uma conta' : 'Já possuo uma conta'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    textAlign: "center",
  },
  logo: {
    width: 400,
    height: 300,
    justifyContent: "center",
    alignSelf: "center",
  },
  label: {
    marginBottom: 10,
    color: "red",
  },
  colorButton: {
    width: '50%',
    alignSelf: 'center',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  loginText: {
    color: "#FFF",
    fontSize: 24,
    textAlign: 'center',
  },
  switchText: {
    textAlign: 'center',
    marginTop: 15,
    color: '#4682B4',
    textDecorationLine: 'underline',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
  },
});