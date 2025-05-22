import * as React from 'react';
import { Text, View, StyleSheet, TextInput, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { db } from '../services/connectionFirebase';
import { getAuth } from 'firebase/auth';
import { ref, push, onValue, set } from 'firebase/database';
import AwesomeAlert from 'react-native-awesome-alerts';

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

    const [showAlert, setShowAlert] = React.useState(false);
    const [gameToDelete, setGameToDelete] = React.useState(null);
    
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
                console.warning("Game deleted successfully");
                alert('Produto deletado com sucesso');
                setShowAlert(false);
                setGameToDelete(null);
            })
            .catch((error) => {
                console.error("Error deleting game: ", error);
                alert('Erro ao deletar produto');
            });
    };

    const showDeleteConfirmation = (id) => {
        setGameToDelete(id);
        setShowAlert(true);
    };

    const toggleCategoryTag = (tag) => {
        if (selectedCategoryTags.includes(tag)) {
            setSelectedCategoryTags(selectedCategoryTags.filter(t => t !== tag));
        } else {
            setSelectedCategoryTags([...selectedCategoryTags, tag]);
        }
        
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
        
        setNewgame({
            ...newgame,
            platform: selectedPlatformTags.includes(tag) 
                ? selectedPlatformTags.filter(t => t !== tag).join(', ')
                : [...selectedPlatformTags, tag].join(', ')
        });
        
        setErrors({ ...errors, platform: false });
    };

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

    const startEditing = (item) => {
        setEditingId(item.id);
        
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
                {item.onSale ? (
                    <View style={styles.priceContainer}>
                        <Text style={styles.originalPrice}>R$ {item.originalPrice}</Text>
                        <Text style={styles.discountedPrice}>R$ {item.price}</Text>
                    </View>
                ) : (
                    <Text style={styles.gamePrice}>R$ {item.price}</Text>
                )}
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
                
                {item.onSale && (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Promoção:</Text>
                        <Text style={styles.discountBadge}>{item.discountPercentage}% OFF</Text>
                    </View>
                )}
                
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
                    onPress={() => showDeleteConfirmation(item.id)}
                >
                    <Text style={styles.buttonText}>Deletar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

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
            <AwesomeAlert
                show={showAlert}
                showProgress={false}
                title="Confirmação"
                message="Tem certeza que deseja excluir este jogo?"
                closeOnTouchOutside={true}
                closeOnHardwareBackPress={false}
                showCancelButton={true}
                showConfirmButton={true}
                cancelText="Cancelar"
                confirmText="Deletar"
                confirmButtonColor="#DD6B55"
                cancelButtonColor="#8A2BE2"
                onCancelPressed={() => {
                    setShowAlert(false);
                }}
                onConfirmPressed={() => {
                    if (gameToDelete) {
                        deletegame(gameToDelete);
                        setGameToDelete(null);
                    }
                    setShowAlert(false);
                }}
                titleStyle={{ fontSize: 18, fontWeight: 'bold' }}
                messageStyle={{ fontSize: 16 }}
                contentContainerStyle={{ borderRadius: 10, padding: 10 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    inputContainer: {
        padding: 16,
    },
    formTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    inputError: {
        borderColor: '#ff3b30',
    },
    errorText: {
        color: '#ff3b30',
        marginBottom: 8,
        marginTop: -8,
        fontSize: 12,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    addButton: {
        backgroundColor: '#8a2be2',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 16,
    },
    updateButton: {
        backgroundColor: '#2196F3',
        flex: 1,
        marginRight: 8,
    },
    cancelButton: {
        backgroundColor: '#f44336',
        flex: 1,
        marginLeft: 8,
    },
    formButtonsContainer: {
        flexDirection: 'row',
        marginVertical: 16,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    listTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
        color: '#333',
    },
    list: {
        marginBottom: 16,
    },
    gameItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    gameHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 8,
    },
    gameTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    gamePrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    originalPrice: {
        fontSize: 14,
        color: '#999',
        textDecorationLine: 'line-through',
    },
    discountedPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#f44336',
    },
    gameDetails: {
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    detailLabel: {
        fontWeight: 'bold',
        color: '#666',
        width: 100,
    },
    detailValue: {
        color: '#333',
        flex: 1,
    },
    descriptionContainer: {
        marginTop: 8,
    },
    description: {
        color: '#333',
        marginTop: 4,
        lineHeight: 20,
    },
    discountBadge: {
        backgroundColor: '#f44336',
        color: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 'bold',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        padding: 10,
        borderRadius: 6,
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    editButton: {
        backgroundColor: '#2196F3',
    },
    deleteButton: {
        backgroundColor: '#f44336',
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    tagContainer: {
        marginBottom: 12,
    },
    tag: {
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    selectedTag: {
        backgroundColor: '#8A2BE2', 
        borderColor: '#7B1FA2', 
    },
    tagText: {
        fontSize: 14,
        color: '#333',
    },
    selectedTagText: {
        color: '#fff',
    },
    addTagButton: {
        backgroundColor: '#ddd',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    },
    addTagButtonText: {
        color: '#666',
    },
    customTagInputContainer: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    customTagInput: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        marginRight: 8,
    },
    addCustomTagButton: {
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    addCustomTagButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default ListScreen;