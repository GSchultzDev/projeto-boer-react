import * as React from 'react';
import { Text, View, StyleSheet, TextInput, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';
import { db } from '../services/connectionFirebase';
import { getAuth } from 'firebase/auth';
import { ref, push, onValue, set } from 'firebase/database';
function HomeScreen() {
    return (
<View style={styles.container}>
<Text></Text>
</View>
    );
}

function ListScreen() {
    const [foodList, setFoodList] = React.useState([]);
    const [newFood, setNewFood] = React.useState({
        name: '',
        price: '',
        category: '',
        description: '',
        calories: ''
    });
    const [errors, setErrors] = React.useState({});
    const [editingId, setEditingId] = React.useState(null);

    const validateInputs = () => {
        const newErrors = {};
        if (!newFood.name) newErrors.name = true;
        if (!newFood.price) newErrors.price = true;
        if (!newFood.category) newErrors.category = true;
        if (!newFood.description) newErrors.description = true;
        if (!newFood.calories) newErrors.calories = true;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const formatPrice = (text) => {
        const numericValue = text.replace(/[^0-9]/g, '');
        
        const paddedValue = numericValue.padStart(4, '0');
        
        const formattedPrice = (paddedValue.slice(0, -2) + '.' + paddedValue.slice(-2)).replace(/^0+(\d)/, '$1');
        
        return formattedPrice;
    };

    React.useEffect(() => {
        const foodsRef = ref(db, 'foods');
        const unsubscribe = onValue(foodsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const foodArray = Object.entries(data).map(([key, value]) => ({
                    id: key,
                    ...value
                }));
                setFoodList(foodArray);
            } else {
                setFoodList([]);
            }
        });

        return () => unsubscribe();
    }, []);


    const addFood = () => {
        if (validateInputs()) {
            const auth = getAuth();
            const userEmail = auth.currentUser?.email || 'anonymous';
            const foodsRef = ref(db, 'foods');
            const newFoodRef = push(foodsRef);
            
            set(newFoodRef, {
                name: newFood.name,
                price: newFood.price,
                category: newFood.category,
                description: newFood.description,
                calories: newFood.calories,
                createdAt: new Date().toISOString(),
                createdBy: userEmail,
                lastUpdatedBy: userEmail
            })
            .then(() => {
                setNewFood({ name: '', price: '', category: '', description: '', calories: '' });
                setErrors({});
            })
            .catch((error) => {
                console.error("Error adding food: ", error);
                alert('Erro ao adicionar produto');
            });
        }
    };

    const updateFood = () => {
        if (validateInputs() && editingId) {
            const auth = getAuth();
            const userEmail = auth.currentUser?.email || 'anonymous';
            const foodRef = ref(db, `foods/${editingId}`);
            
            const existingFood = foodList.find(food => food.id === editingId);
            
            set(foodRef, {
                ...existingFood,
                name: newFood.name,
                price: newFood.price,
                category: newFood.category,
                description: newFood.description,
                calories: newFood.calories,
                updatedAt: new Date().toISOString(),
                lastUpdatedBy: userEmail
            })
            .then(() => {
                setNewFood({ name: '', price: '', category: '', description: '', calories: '' });
                setErrors({});
                setEditingId(null);
            })
            .catch((error) => {
                console.error("Error updating food: ", error);
                alert('Erro ao atualizar produto');
            });
        }
    };

    const deleteFood = (id) => {
        const foodRef = ref(db, `foods/${id}`);
        set(foodRef, null)
            .then(() => {
            })
            .catch((error) => {
                console.error("Error deleting food: ", error);
                alert('Erro ao deletar produto');
            });
    };

    const startEditing = (item) => {
        setEditingId(item.id);
        setNewFood({
            name: item.name,
            price: item.price,
            category: item.category,
            description: item.description,
            calories: item.calories
        });
    };


    const renderItem = ({ item }) => (
        <View style={styles.foodItem}>
            <Text style={styles.foodTitle}>{item.name}</Text>
            <Text>Preço: R$ {item.price}</Text>
            <Text>Categoria: {item.category}</Text>
            <Text>Descrição: {item.description}</Text>
            <Text>Calorias: {item.calories} kcal</Text>
            
            <View style={styles.buttonContainer}>
                <TouchableOpacity 
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => startEditing(item)}
                >
                    <Text style={styles.buttonText}>Editar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => deleteFood(item.id)}
                >
                    <Text style={styles.buttonText}>Deletar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const handleSubmit = () => {
        if (validateInputs()) {
            if (editingId) {
                const foodRef = ref(db, `foods/${editingId}`);
                set(foodRef, {
                    name: newFood.name,
                    price: newFood.price,
                    category: newFood.category,
                    description: newFood.description,
                    calories: newFood.calories,
                    updatedAt: new Date().toISOString()
                })
                .then(() => {
                    setNewFood({ name: '', price: '', category: '', description: '', calories: '' });
                    setErrors({});
                    setEditingId(null);
                })
                .catch((error) => {
                    console.error("Error updating food: ", error);
                    alert('Erro ao atualizar produto');
                });
            } else {
                const foodsRef = ref(db, 'foods');
                const newFoodRef = push(foodsRef);
                
                set(newFoodRef, {
                    name: newFood.name,
                    price: newFood.price,
                    category: newFood.category,
                    description: newFood.description,
                    calories: newFood.calories,
                    createdAt: new Date().toISOString()
                })
                .then(() => {
                    setNewFood({ name: '', price: '', category: '', description: '', calories: '' });
                    setErrors({});
                })
                .catch((error) => {
                    console.error("Error adding food: ", error);
                    alert('Erro ao adicionar produto');
                });
            }
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setNewFood({ name: '', price: '', category: '', description: '', calories: '' });
        setErrors({});
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.inputContainer}>
                <TextInput
                    style={[
                        styles.input,
                        errors.name && styles.inputError
                    ]}
                    placeholder="Nome do Produto *"
                    value={newFood.name}
                    onChangeText={(text) => {
                        setNewFood({ ...newFood, name: text });
                        setErrors({ ...errors, name: false });
                    }}
                />
                {errors.name && <Text style={styles.errorText}>Nome é obrigatório</Text>}

                
                <TextInput
                    style={[
                        styles.input,
                        errors.price && styles.inputError
                    ]}
                    placeholder="Preço (R$) *"
                    value={newFood.price || '0.00'}
                    keyboardType="numeric"
                    onChangeText={(text) => {
                        const formatted = formatPrice(text);
                        setNewFood({ ...newFood, price: formatted });
                        setErrors({ ...errors, price: false });
                    }}
                />
                {errors.price && <Text style={styles.errorText}>Preço é obrigatório</Text>}

                <TextInput
                    style={[
                        styles.input,
                        errors.category && styles.inputError
                    ]}
                    placeholder="Categoria *"
                    value={newFood.category}
                    onChangeText={(text) => {
                        setNewFood({ ...newFood, category: text });
                        setErrors({ ...errors, category: false });
                    }}
                />
                {errors.category && <Text style={styles.errorText}>Categoria é obrigatória</Text>}

                <TextInput
                    style={[
                        styles.input,
                        errors.description && styles.inputError
                    ]}
                    placeholder="Descrição *"
                    value={newFood.description}
                    onChangeText={(text) => {
                        setNewFood({ ...newFood, description: text });
                        setErrors({ ...errors, description: false });
                    }}
                />
                {errors.description && <Text style={styles.errorText}>Descrição é obrigatória</Text>}

                <TextInput
                    style={[
                        styles.input,
                        errors.calories && styles.inputError
                    ]}
                    placeholder="Calorias *"
                    value={newFood.calories}
                    keyboardType="numeric"
                    onChangeText={(text) => {
                        const numericOnly = text.replace(/[^0-9]/g, '');
                        setNewFood({ ...newFood, calories: numericOnly });
                        setErrors({ ...errors, calories: false });
                    }}
                />
                {errors.calories && <Text style={styles.errorText}>Calorias é obrigatório</Text>}
                {editingId ? (
                    <View style={styles.formButtonsContainer}>
                        <TouchableOpacity 
                            style={[styles.addButton, styles.updateButton]} 
                            onPress={updateFood}
                        >
                            <Text style={styles.buttonText}>Atualizar Produto</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.addButton, styles.cancelButton]} 
                            onPress={cancelEdit}
                        >
                            <Text style={styles.buttonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.addButton} onPress={addFood}>
                        <Text style={styles.buttonText}>Adicionar Produto</Text>
                    </TouchableOpacity>
                )}

                <Text style={styles.listTitle}>Produtos Cadastrados:</Text>
                <FlatList
                    data={foodList}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    style={styles.list}
                />
            </ScrollView>
        </View>
    );
}
function PostScreen() {
    return (
<View style={styles.container}>
<Text></Text>
</View>
    );
}
function PostScreen2() {
    return (
<View style={styles.container}>
<Text></Text>
</View>
    );
}
function APIScreen() {
    return (
<View style={styles.container}>
<Text></Text>
</View>
    );
}
const Tab = createBottomTabNavigator();
export default function Menu() {
    return (
<NavigationContainer>
<Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ color, size }) => {
                        let iconName;
                        switch (route.name) {
                            case 'Home':
                                iconName = 'home';
                                break;
                            case 'Produtos':
                                iconName = 'list'; 
                                break;
                            case 'Promoções':
                                iconName = 'money';
                                break;
                            case 'Comentarios':
                                iconName = 'comment';
                                break;
                            case 'Ler API':
                                iconName = 'android';
                                break;
                            default:
                                iconName = '';
                                break;
                        }
                        return <Icon name={iconName} size={size} color={color} />;
                    },
                    tabBarActiveTintColor: '#b50442',
                    tabBarInactiveTintColor: '#9ea2a3',
                    tabBarStyle: { height: 65 }, 
                    tabBarLabelStyle: { fontSize: 12 },
                    showLabel: true,
                })}
>
<Tab.Screen name="Home" component={HomeScreen} />
<Tab.Screen name="Produtos" component={ListScreen} />
<Tab.Screen
                    name="Promoções"
                    component={PostScreen2}
                />
<Tab.Screen
                    name="Comentarios"
                    component={PostScreen}
                />
<Tab.Screen name="Ler API" component={APIScreen} />
</Tab.Navigator>
</NavigationContainer>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconTabRound: {
        width: 60,
        height: 90,
        borderRadius: 30,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#006400',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    inputContainer: {
        width: '100%',
        padding: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
        backgroundColor: '#fff',
    },
    addButton: {
        backgroundColor: '#b50442',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    list: {
        width: '100%',
    },
    listTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginVertical: 10,
        color: '#333',
    },
    foodItem: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    foodTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#b50442',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    actionButton: {
        padding: 8,
        borderRadius: 5,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    editButton: {
        backgroundColor: '#4CAF50',
    },
    deleteButton: {
        backgroundColor: '#f44336',
    },
    formButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    updateButton: {
        backgroundColor: '#4CAF50',
        flex: 1,
        marginRight: 5,
    },
    cancelButton: {
        backgroundColor: '#f44336',
        flex: 1,
        marginLeft: 5,
    },
});