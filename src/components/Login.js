import { View, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Card, Text, TextInput } from "react-native-paper";
import React, { useState } from "react";

import { auth } from '../services/connectionFirebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import DevAutomateIcon from '../../assets/icon.jpg';
import { LinearGradient } from 'expo-linear-gradient';

export default function Login({ changeStatus }) {
  const [form, setForm] = useState({
    email: "teste4@hotmail.com",
    password: "Jacarezao14@",
  });
  const [type, setType] = useState("login");
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const validateEmail = (email) => {
    if (!email) {
      setErrors((prev) => ({ ...prev, email: "Email é obrigatório" }));
      return false;
    }
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!re.test(email)) {
      setErrors((prev) => ({ ...prev, email: "Email inválido" }));
      return false;
    }
    return true;
  };

  const validatePassword = (password) => {
    const specialChars = /[!@#$%^&*(),.?":{}|<>]/;
    const upperCase = /[A-Z]/;
    const lowerCase = /[a-z]/;
    const numbers = /[0-9]/;

    if (!specialChars.test(password)) {
      setErrors((prev) => ({ ...prev, password: "A senha deve conter pelo menos um caractere especial" }));
      return false;
    }
    if (!upperCase.test(password)) {
      setErrors((prev) => ({ ...prev, password: "A senha deve conter pelo menos uma letra maiúscula" }));
      return false;
    }
    if (!lowerCase.test(password)) {
      setErrors((prev) => ({ ...prev, password: "A senha deve conter pelo menos uma letra minúscula" }));
      return false;
    }
    if (!numbers.test(password)) {
      setErrors((prev) => ({ ...prev, password: "A senha deve conter pelo menos um número" }));
      return false;
    }
    if (password.length < 6) {
      setErrors((prev) => ({ ...prev, password: "A senha deve ter pelo menos 6 caracteres" }));
      return false;
    }
    return true;
  };

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleAuth = () => {
    const isEmailValid = validateEmail(form.email);
    const isPasswordValid = validatePassword(form.password);

    if (!isEmailValid || !isPasswordValid) return;

    if (type === 'login') {
      signInWithEmailAndPassword(auth, form.email, form.password)
        .then((userCredential) => {
          changeStatus(userCredential.user.uid);
        })
        .catch((err) => {
          switch (err.code) {
            case 'auth/invalid-credential':
              alert('Email ou senha incorretos!');
              break;
            case 'auth/user-not-found':
              setErrors((prev) => ({ ...prev, email: "Email não cadastrado" }));
              break;
            case 'auth/too-many-requests':
              alert('Muitas tentativas incorretas. Por favor, tente novamente mais tarde.');
              break;
            default:
              alert('Erro ao fazer login. Por favor, tente novamente.');
          }
        });
    } else {
      createUserWithEmailAndPassword(auth, form.email, form.password)
        .then((userCredential) => {
          changeStatus(userCredential.user.uid);
        })
        .catch((err) => {
          switch (err.code) {
            case 'auth/email-already-in-use':
              setErrors((prev) => ({ ...prev, email: "Este email já está cadastrado" }));
              break;
            case 'auth/weak-password':
              setErrors((prev) => ({ ...prev, password: "Senha muito fraca" }));
              break;
            default:
              alert('Erro ao cadastrar. Por favor, tente novamente.');
          }
        });
    }
  };

  return (
    <LinearGradient
      colors={['#e0eafc', '#cfdef3']}
      style={styles.gradientContainer}
    >
      <View style={styles.innerContainer}>
        <Image style={styles.logo} source={DevAutomateIcon} />
        <Text variant="titleLarge" style={styles.title}>
          {type === 'login' ? 'Bem-vindo de volta!' : 'Crie sua conta'}
        </Text>
        <TextInput
          style={styles.input}
          mode="outlined"
          label="E-mail"
          value={form.email}
          onChangeText={(text) => handleInputChange("email", text)}
          error={!!errors.email}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
        <TextInput
          style={styles.input}
          mode="outlined"
          label="Senha"
          placeholder="Mínimo 6 caracteres"
          secureTextEntry
          maxLength={30}
          value={form.password}
          onChangeText={(text) => handleInputChange("password", text)}
          error={!!errors.password}
        />
        {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        {type === 'login' && (
          <TouchableOpacity style={styles.forgotButton}>
            <Text style={styles.forgotText}>Esqueceu a senha?</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.colorButton,
            { backgroundColor: type === 'login' ? '#4682B4' : '#FF0000' },
          ]}
          onPress={handleAuth}>
          <Text style={styles.loginText}>
            {type === 'login' ? 'Acessar' : 'Cadastrar'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            setType((prevType) => (prevType === 'login' ? 'cadastrar' : 'login'))
          }>
          <Text style={styles.switchText}>
            {type === 'login' ? 'Criar uma conta' : 'Já possuo uma conta'}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  innerContainer: {
    width: '90%',
    maxWidth: 350,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    elevation: 4,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
    borderRadius: 24,
    alignSelf: "center",
    resizeMode: "contain",
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  card: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    backgroundColor: "#fff",
  },
  title: {
    textAlign: "center",
    marginBottom: 18,
    fontWeight: "bold",
    color: "#222",
    fontSize: 22,
  },
  input: {
    marginBottom: 10,
    backgroundColor: "#f0f4f8",
  },
  colorButton: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 8,
    alignSelf: 'center',
    elevation: 2,
  },
  loginText: {
    color: "#FFF",
    fontSize: 18,
    textAlign: 'center',
    fontWeight: "bold",
  },
  switchText: {
    textAlign: 'center',
    marginTop: 8,
    color: '#4682B4',
    textDecorationLine: 'underline',
    fontSize: 15,
  },
  errorText: {
    color: 'red',
    fontSize: 13,
    marginBottom: 6,
    marginLeft: 2,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  forgotText: {
    color: '#4682B4',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});