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
    const [gameList, setgameList] = React.useState([]);
    const [newgame, setNewgame] = React.useState({
        name: '',
        price: '',
        category: '',
        description: '',
        releaseYear: '',
        platform: ''
    });
    const [errors, setErrors] = React.useState({});
    const [editingId, setEditingId] = React.useState(null);
    
    // Add these new states for tag management
    const [categoryTags, setCategoryTags] = React.useState(['RPG', 'Ação', 'Aventura', 'Estratégia', 'Esporte', 'Simulação', 'Corrida']);
    const [platformTags, setPlatformTags] = React.useState(['PC', 'PS5', 'PS4', 'Xbox Series X', 'Xbox One', 'Nintendo Switch', 'Mobile']);
    const [selectedCategoryTags, setSelectedCategoryTags] = React.useState([]);
    const [selectedPlatformTags, setSelectedPlatformTags] = React.useState([]);
    const [newCategoryTag, setNewCategoryTag] = React.useState('');
    const [newPlatformTag, setNewPlatformTag] = React.useState('');
    const [showCategoryInput, setShowCategoryInput] = React.useState(false);
    const [showPlatformInput, setShowPlatformInput] = React.useState(false);

    const validateInputs = () => {
        const newErrors = {};
        if (!newgame.name) newErrors.name = true;
        if (!newgame.price) newErrors.price = true;
        if (!newgame.category) newErrors.category = true;
        if (!newgame.description) newErrors.description = true;
        if (!newgame.releaseYear) newErrors.releaseYear = true;
        if (!newgame.platform) newErrors.platform = true;

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
        const gamesRef = ref(db, 'games');
        const unsubscribe = onValue(gamesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const gameArray = Object.entries(data).map(([key, value]) => ({
                    id: key,
                    ...value
                }));
                setgameList(gameArray);
            } else {
                setgameList([]);
            }
        });

        return () => unsubscribe();
    }, []);


    const addgame = () => {
        if (validateInputs()) {
            const auth = getAuth();
            const userEmail = auth.currentUser?.email || 'anonymous';
            const gamesRef = ref(db, 'games');
            const newgameRef = push(gamesRef);
            
            set(newgameRef, {
                name: newgame.name,
                price: newgame.price,
                category: newgame.category,
                description: newgame.description,
                releaseYear: newgame.releaseYear,
                platform: newgame.platform,
                createdAt: new Date().toISOString(),
                createdBy: userEmail,
                lastUpdatedBy: userEmail
            })
            .then(() => {
                setNewgame({ name: '', price: '', category: '', description: '', releaseYear: '', platform: '' });
                setErrors({});
            })
            .catch((error) => {
                console.error("Error adding game: ", error);
                alert('Erro ao adicionar jogo');
            });
        }
    };

    const updategame = () => {
        if (validateInputs() && editingId) {
            const auth = getAuth();
            const userEmail = auth.currentUser?.email || 'anonymous';
            const gameRef = ref(db, `games/${editingId}`);
            
            const existinggame = gameList.find(game => game.id === editingId);
            
            set(gameRef, {
                ...existinggame,
                name: newgame.name,
                price: newgame.price,
                category: newgame.category,
                description: newgame.description,
                releaseYear: newgame.releaseYear,
                platform: newgame.platform,
                updatedAt: new Date().toISOString(),
                lastUpdatedBy: userEmail
            })
            .then(() => {
                setNewgame({ name: '', price: '', category: '', description: '', releaseYear: '', platform: '' });
                setErrors({});
                setEditingId(null);
            })
            .catch((error) => {
                console.error("Error updating game: ", error);
                alert('Erro ao atualizar jogo');
            });
        }
    };

    const deletegame = (id) => {
        const gameRef = ref(db, `games/${id}`);
        set(gameRef, null)
            .then(() => {
            })
            .catch((error) => {
                console.error("Error deleting game: ", error);
                alert('Erro ao deletar produto');
            });
    };

    // Add this function to handle tag selection
    const toggleCategoryTag = (tag) => {
        if (selectedCategoryTags.includes(tag)) {
            setSelectedCategoryTags(selectedCategoryTags.filter(t => t !== tag));
        } else {
            setSelectedCategoryTags([...selectedCategoryTags, tag]);
        }
        
        // Update the newgame state with the selected tags
        setNewgame({
            ...newgame,
            category: selectedCategoryTags.includes(tag) 
                ? selectedCategoryTags.filter(t => t !== tag).join(', ')
                : [...selectedCategoryTags, tag].join(', ')
        });
        
        setErrors({ ...errors, category: false });
    };

    const togglePlatformTag = (tag) => {
        if (selectedPlatformTags.includes(tag)) {
            setSelectedPlatformTags(selectedPlatformTags.filter(t => t !== tag));
        } else {
            setSelectedPlatformTags([...selectedPlatformTags, tag]);
        }
        
        // Update the newgame state with the selected tags
        setNewgame({
            ...newgame,
            platform: selectedPlatformTags.includes(tag) 
                ? selectedPlatformTags.filter(t => t !== tag).join(', ')
                : [...selectedPlatformTags, tag].join(', ')
        });
        
        setErrors({ ...errors, platform: false });
    };

    // Add this function to add new custom tags
    const addCustomCategoryTag = () => {
        if (newCategoryTag && !categoryTags.includes(newCategoryTag)) {
            setCategoryTags([...categoryTags, newCategoryTag]);
            toggleCategoryTag(newCategoryTag);
            setNewCategoryTag('');
            setShowCategoryInput(false);
        }
    };

    const addCustomPlatformTag = () => {
        if (newPlatformTag && !platformTags.includes(newPlatformTag)) {
            setPlatformTags([...platformTags, newPlatformTag]);
            togglePlatformTag(newPlatformTag);
            setNewPlatformTag('');
            setShowPlatformInput(false);
        }
    };

    // Modify the startEditing function to handle tags
    const startEditing = (item) => {
        setEditingId(item.id);
        
        // Parse the category and platform strings into arrays
        const categoryArray = item.category ? item.category.split(', ') : [];
        const platformArray = item.platform ? item.platform.split(', ') : [];
        
        setSelectedCategoryTags(categoryArray);
        setSelectedPlatformTags(platformArray);
        
        setNewgame({
            name: item.name,
            price: item.price,
            category: item.category,
            description: item.description,
            releaseYear: item.releaseYear || '',
            platform: item.platform || ''
        });
    };

    // Modify the cancelEdit function to reset tags
    const cancelEdit = () => {
        setEditingId(null);
        setNewgame({ name: '', price: '', category: '', description: '', releaseYear: '', platform: '' });
        setErrors({});
        setSelectedCategoryTags([]);
        setSelectedPlatformTags([]);
    };

    const renderItem = ({ item }) => (
        <View style={styles.gameItem}>
            <View style={styles.gameHeader}>
                <Text style={styles.gameTitle}>{item.name}</Text>
                <Text style={styles.gamePrice}>R$ {item.price}</Text>
            </View>
            
            <View style={styles.gameDetails}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Categoria:</Text>
                    <Text style={styles.detailValue}>{item.category}</Text>
                </View>
                
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Plataforma:</Text>
                    <Text style={styles.detailValue}>{item.platform}</Text>
                </View>
                
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Ano:</Text>
                    <Text style={styles.detailValue}>{item.releaseYear}</Text>
                </View>
                
                <View style={styles.descriptionContainer}>
                    <Text style={styles.detailLabel}>Descrição:</Text>
                    <Text style={styles.description}>{item.description}</Text>
                </View>
            </View>
            
            <View style={styles.buttonContainer}>
                <TouchableOpacity 
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => startEditing(item)}
                >
                    <Text style={styles.buttonText}>Editar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => deletegame(item.id)}
                >
                    <Text style={styles.buttonText}>Deletar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const handleSubmit = () => {
        if (validateInputs()) {
            if (editingId) {
                const gameRef = ref(db, `games/${editingId}`);
                set(gameRef, {
                    name: newgame.name,
                    price: newgame.price,
                    category: newgame.category,
                    description: newgame.description,
                    calories: newgame.calories,
                    updatedAt: new Date().toISOString()
                })
                .then(() => {
                    setNewgame({ name: '', price: '', category: '', description: '', calories: '' });
                    setErrors({});
                    setEditingId(null);
                })
                .catch((error) => {
                    console.error("Error updating game: ", error);
                    alert('Erro ao atualizar produto');
                });
            } else {
                const gamesRef = ref(db, 'games');
                const newgameRef = push(gamesRef);
                
                set(newgameRef, {
                    name: newgame.name,
                    price: newgame.price,
                    category: newgame.category,
                    description: newgame.description,
                    calories: newgame.calories,
                    createdAt: new Date().toISOString()
                })
                .then(() => {
                    setNewgame({ name: '', price: '', category: '', description: '', calories: '' });
                    setErrors({});
                })
                .catch((error) => {
                    console.error("Error adding game: ", error);
                    alert('Erro ao adicionar produto');
                });
            }
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.inputContainer}>
                <Text style={styles.formTitle}>Adicionar Novo Jogo</Text>
                
                <TextInput
                    style={[
                        styles.input,
                        errors.name && styles.inputError
                    ]}
                    placeholder="Nome do Jogo *"
                    value={newgame.name}
                    onChangeText={(text) => {
                        setNewgame({ ...newgame, name: text });
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
                    value={newgame.price || '0.00'}
                    keyboardType="numeric"
                    onChangeText={(text) => {
                        const formatted = formatPrice(text);
                        setNewgame({ ...newgame, price: formatted });
                        setErrors({ ...errors, price: false });
                    }}
                />
                {errors.price && <Text style={styles.errorText}>Preço é obrigatório</Text>}

                {/* Replace the category TextInput with a tag system */}
                <Text style={styles.inputLabel}>Categoria(s) *</Text>
                <View style={styles.tagContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {categoryTags.map((tag, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.tag,
                                    selectedCategoryTags.includes(tag) && styles.selectedTag
                                ]}
                                onPress={() => toggleCategoryTag(tag)}
                            >
                                <Text style={[
                                    styles.tagText,
                                    selectedCategoryTags.includes(tag) && styles.selectedTagText
                                ]}>
                                    {tag}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={styles.addTagButton}
                            onPress={() => setShowCategoryInput(!showCategoryInput)}
                        >
                            <Text style={styles.addTagButtonText}>+ Nova</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
                
                {showCategoryInput && (
                    <View style={styles.customTagInputContainer}>
                        <TextInput
                            style={styles.customTagInput}
                            placeholder="Nova categoria"
                            value={newCategoryTag}
                            onChangeText={setNewCategoryTag}
                        />
                        <TouchableOpacity
                            style={styles.addCustomTagButton}
                            onPress={addCustomCategoryTag}
                        >
                            <Text style={styles.addCustomTagButtonText}>Adicionar</Text>
                        </TouchableOpacity>
                    </View>
                )}
                
                {errors.category && <Text style={styles.errorText}>Categoria é obrigatória</Text>}

                {/* Replace the platform TextInput with a tag system */}
                <Text style={styles.inputLabel}>Plataforma(s) *</Text>
                <View style={styles.tagContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {platformTags.map((tag, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.tag,
                                    selectedPlatformTags.includes(tag) && styles.selectedTag
                                ]}
                                onPress={() => togglePlatformTag(tag)}
                            >
                                <Text style={[
                                    styles.tagText,
                                    selectedPlatformTags.includes(tag) && styles.selectedTagText
                                ]}>
                                    {tag}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={styles.addTagButton}
                            onPress={() => setShowPlatformInput(!showPlatformInput)}
                        >
                            <Text style={styles.addTagButtonText}>+ Nova</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
                
                {showPlatformInput && (
                    <View style={styles.customTagInputContainer}>
                        <TextInput
                            style={styles.customTagInput}
                            placeholder="Nova plataforma"
                            value={newPlatformTag}
                            onChangeText={setNewPlatformTag}
                        />
                        <TouchableOpacity
                            style={styles.addCustomTagButton}
                            onPress={addCustomPlatformTag}
                        >
                            <Text style={styles.addCustomTagButtonText}>Adicionar</Text>
                        </TouchableOpacity>
                    </View>
                )}
                
                {errors.platform && <Text style={styles.errorText}>Plataforma é obrigatória</Text>}

                <TextInput
                    style={[
                        styles.input,
                        errors.releaseYear && styles.inputError
                    ]}
                    placeholder="Ano de Lançamento *"
                    value={newgame.releaseYear}
                    keyboardType="numeric"
                    onChangeText={(text) => {
                        const numericOnly = text.replace(/[^0-9]/g, '');
                        setNewgame({ ...newgame, releaseYear: numericOnly });
                        setErrors({ ...errors, releaseYear: false });
                    }}
                />
                {errors.releaseYear && <Text style={styles.errorText}>Ano de lançamento é obrigatório</Text>}

                <TextInput
                    style={[
                        styles.input,
                        styles.textArea,
                        errors.description && styles.inputError
                    ]}
                    placeholder="Descrição do Jogo *"
                    value={newgame.description}
                    multiline={true}
                    numberOfLines={4}
                    onChangeText={(text) => {
                        setNewgame({ ...newgame, description: text });
                        setErrors({ ...errors, description: false });
                    }}
                />
                {errors.description && <Text style={styles.errorText}>Descrição é obrigatória</Text>}
                
                {editingId ? (
                    <View style={styles.formButtonsContainer}>
                        <TouchableOpacity 
                            style={[styles.addButton, styles.updateButton]} 
                            onPress={updategame}
                        >
                            <Text style={styles.buttonText}>Atualizar Jogo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.addButton, styles.cancelButton]} 
                            onPress={cancelEdit}
                        >
                            <Text style={styles.buttonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.addButton} onPress={addgame}>
                        <Text style={styles.buttonText}>Adicionar Jogo</Text>
                    </TouchableOpacity>
                )}

                <Text style={styles.listTitle}>Jogos Disponíveis:</Text>
                <FlatList
                    data={gameList}
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
                            case 'Jogos':
                                iconName = 'gamepad'; 
                                break;
                            case 'Promoções':
                                iconName = 'percent';
                                break;
                            case 'Comentarios':
                                iconName = 'comment';
                                break;
                            case 'Ler API':
                                iconName = 'cloud-download';
                                break;
                            default:
                                iconName = '';
                                break;
                        }
                        return <Icon name={iconName} size={size} color={color} />;
                    },
                    tabBarActiveTintColor: '#4a148c', // Purple color for gaming theme
                    tabBarInactiveTintColor: '#9ea2a3',
                    tabBarStyle: { height: 65 }, 
                    tabBarLabelStyle: { fontSize: 12 },
                    showLabel: true,
                })}
            >
                <Tab.Screen name="Home" component={HomeScreen} />
                <Tab.Screen name="Jogos" component={ListScreen} />
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
        backgroundColor: '#f5f5f5',
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
    formTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
        backgroundColor: '#fff',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    inputError: {
        borderColor: '#f44336',
    },
    errorText: {
        color: '#f44336',
        marginBottom: 10,
        fontSize: 12,
    },
    addButton: {
        backgroundColor: '#4a148c', // Purple color for gaming theme
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
        fontSize: 22,
        fontWeight: 'bold',
        marginVertical: 15,
        color: '#333',
        textAlign: 'center',
    },
    gameItem: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    gameHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    gameTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4a148c', // Purple color for gaming theme
        flex: 3,
    },
    gamePrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4CAF50',
        flex: 1,
        textAlign: 'right',
    },
    gameDetails: {
        marginBottom: 10,
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    detailLabel: {
        fontWeight: 'bold',
        marginRight: 5,
        color: '#555',
    },
    detailValue: {
        color: '#333',
    },
    descriptionContainer: {
        marginTop: 5,
    },
    description: {
        color: '#666',
        marginTop: 3,
        lineHeight: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    actionButton: {
        padding: 10,
        borderRadius: 5,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    editButton: {
        backgroundColor: '#4a148c', // Purple color for gaming theme
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
        backgroundColor: '#4a148c', // Purple color for gaming theme
        flex: 1,
        marginRight: 5,
    },
    cancelButton: {
        backgroundColor: '#f44336',
        flex: 1,
        marginLeft: 5,
    },inputLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10,
        marginBottom: 5,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'nowrap',
        marginBottom: 10,
    },
    tag: {
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 15,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    selectedTag: {
        backgroundColor: '#4a148c',
        borderColor: '#4a148c',
    },
    tagText: {
        color: '#333',
        fontSize: 14,
    },
    selectedTagText: {
        color: '#fff',
    },
    addTagButton: {
        backgroundColor: '#e0e0e0',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 15,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    addTagButtonText: {
        color: '#666',
        fontSize: 14,
    },
    customTagInputContainer: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    customTagInput: {
        flex: 3,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 10,
        backgroundColor: '#fff',
        marginRight: 10,
    },
    addCustomTagButton: {
        flex: 1,
        backgroundColor: '#4a148c',
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addCustomTagButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});