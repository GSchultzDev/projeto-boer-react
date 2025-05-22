import * as React from 'react';
import { Text, View, StyleSheet, TextInput, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { db } from '../services/connectionFirebase';
import { getAuth } from 'firebase/auth';
import { ref, push, onValue, set } from 'firebase/database';
import AwesomeAlert from 'react-native-awesome-alerts';

function PostScreen2() {const [promotions, setPromotions] = React.useState([]);
    const [newPromotion, setNewPromotion] = React.useState({
        name: '',
        discountPercentage: '',
        tagType: 'category',
        tagValue: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
    });
    const [errors, setErrors] = React.useState({});
    const [editingId, setEditingId] = React.useState(null);
    const [gameList, setGameList] = React.useState([]);
    const [categoryTags, setCategoryTags] = React.useState(['RPG', 'Ação', 'Aventura', 'Estratégia', 'Esporte', 'Simulação', 'Corrida']);
    const [platformTags, setPlatformTags] = React.useState(['PC', 'PS5', 'PS4', 'Xbox Series X', 'Xbox One', 'Nintendo Switch', 'Mobile']);
    
    React.useEffect(() => {
        const gamesRef = ref(db, 'games');
        const promotionsRef = ref(db, 'promotions');
        
        const gamesUnsubscribe = onValue(gamesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const gameArray = Object.entries(data).map(([key, value]) => ({
                    id: key,
                    ...value
                }));
                setGameList(gameArray);
                
                const categories = new Set();
                const platforms = new Set();
                
                gameArray.forEach(game => {
                    if (game.category) {
                        game.category.split(', ').forEach(cat => categories.add(cat));
                    }
                    if (game.platform) {
                        game.platform.split(', ').forEach(plat => platforms.add(plat));
                    }
                });
                
                if (categories.size > 0) {
                    setCategoryTags(Array.from(categories));
                }
                
                if (platforms.size > 0) {
                    setPlatformTags(Array.from(platforms));
                }
            }
        });
        
        const promotionsUnsubscribe = onValue(promotionsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const promotionArray = Object.entries(data).map(([key, value]) => ({
                    id: key,
                    ...value
                }));
                setPromotions(promotionArray);
            } else {
                setPromotions([]);
            }
        });
        
        return () => {
            gamesUnsubscribe();
            promotionsUnsubscribe();
        };
    }, []);
    
    const validateInputs = () => {
        const newErrors = {};
        if (!newPromotion.name) newErrors.name = true;
        if (!newPromotion.discountPercentage) newErrors.discountPercentage = true;
        if (!newPromotion.tagValue) newErrors.tagValue = true;
        if (!newPromotion.startDate) newErrors.startDate = true;
        if (!newPromotion.endDate) newErrors.endDate = true;
        
        const discount = parseInt(newPromotion.discountPercentage);
        if (isNaN(discount) || discount < 1 || discount > 99) {
            newErrors.discountPercentage = true;
        }
        
        if (newPromotion.startDate && newPromotion.endDate) {
            const start = new Date(newPromotion.startDate);
            const end = new Date(newPromotion.endDate);
            if (end <= start) {
                newErrors.endDate = true;
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const addPromotion = () => {
        if (validateInputs()) {
            const auth = getAuth();
            const userEmail = auth.currentUser?.email || 'anonymous';
            const promotionsRef = ref(db, 'promotions');
            const newPromotionRef = push(promotionsRef);
            
            set(newPromotionRef, {
                name: newPromotion.name,
                discountPercentage: newPromotion.discountPercentage,
                tagType: newPromotion.tagType,
                tagValue: newPromotion.tagValue,
                startDate: newPromotion.startDate,
                endDate: newPromotion.endDate,
                createdAt: new Date().toISOString(),
                createdBy: userEmail,
                active: true
            })
            .then(() => {
                setNewPromotion({
                    name: '',
                    discountPercentage: '',
                    tagType: 'category',
                    tagValue: '',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: ''
                });
                setErrors({});
                applyPromotionsToGames();
            })
            .catch((error) => {
                console.error("Error adding promotion: ", error);
                alert('Erro ao adicionar promoção');
            });
        }
    };
    
    const updatePromotion = () => {
        if (validateInputs() && editingId) {
            const auth = getAuth();
            const userEmail = auth.currentUser?.email || 'anonymous';
            const promotionRef = ref(db, `promotions/${editingId}`);
            
            set(promotionRef, {
                name: newPromotion.name,
                discountPercentage: newPromotion.discountPercentage,
                tagType: newPromotion.tagType,
                tagValue: newPromotion.tagValue,
                startDate: newPromotion.startDate,
                endDate: newPromotion.endDate,
                updatedAt: new Date().toISOString(),
                lastUpdatedBy: userEmail,
                active: true
            })
            .then(() => {
                setNewPromotion({
                    name: '',
                    discountPercentage: '',
                    tagType: 'category',
                    tagValue: '',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: ''
                });
                setErrors({});
                setEditingId(null);
                applyPromotionsToGames();
            })
            .catch((error) => {
                console.error("Error updating promotion: ", error);
                alert('Erro ao atualizar promoção');
            });
        }
    };
    
    const deletePromotion = (id) => {
        const promotionRef = ref(db, `promotions/${id}`);
        set(promotionRef, null)
            .then(() => {
                applyPromotionsToGames();
            })
            .catch((error) => {
                console.error("Error deleting promotion: ", error);
                alert('Erro ao deletar promoção');
            });
    };
    
    const startEditing = (item) => {
        setEditingId(item.id);
        setNewPromotion({
            name: item.name,
            discountPercentage: item.discountPercentage,
            tagType: item.tagType || 'category',
            tagValue: item.tagValue,
            startDate: item.startDate,
            endDate: item.endDate
        });
    };
    
    const cancelEdit = () => {
        setEditingId(null);
        setNewPromotion({
            name: '',
            discountPercentage: '',
            tagType: 'category',
            tagValue: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: ''
        });
        setErrors({});
    };
    
    
    const applyPromotionsToGames = () => {
        
        const promotionsRef = ref(db, 'promotions');
        onValue(promotionsRef, (snapshot) => {
            const promotionsData = snapshot.val();
            if (!promotionsData) return;
            
            const activePromotions = Object.values(promotionsData).filter(promo => {
                const now = new Date();
                const startDate = new Date(promo.startDate);
                const endDate = new Date(promo.endDate);
                return promo.active && now >= startDate && now <= endDate;
            });
            
            gameList.forEach(game => {
                let highestDiscount = 0;
                let appliedPromotion = null;
                
                activePromotions.forEach(promo => {
                    const gameHasTag = promo.tagType === 'category' 
                        ? game.category && game.category.includes(promo.tagValue)
                        : game.platform && game.platform.includes(promo.tagValue);
                    
                    if (gameHasTag && parseInt(promo.discountPercentage) > highestDiscount) {
                        highestDiscount = parseInt(promo.discountPercentage);
                        appliedPromotion = promo;
                    }
                });
                
                const gameRef = ref(db, `games/${game.id}`);
                if (appliedPromotion) {
                    const originalPrice = parseFloat(game.price);
                    const discountAmount = originalPrice * (highestDiscount / 100);
                    const discountedPrice = (originalPrice - discountAmount).toFixed(2);
                    
                    set(gameRef, {
                        ...game,
                        onSale: true,
                        originalPrice: game.originalPrice || game.price,
                        price: discountedPrice,
                        discountPercentage: highestDiscount,
                        promotionName: appliedPromotion.name
                    });
                } else if (game.onSale) {
                    set(gameRef, {
                        ...game,
                        onSale: false,
                        price: game.originalPrice,
                        originalPrice: null,
                        discountPercentage: null,
                        promotionName: null
                    });
                }
            });
        }, { onlyOnce: true });
    };
    
    const getAffectedGamesCount = () => {
        if (!newPromotion.tagValue) return 0;
        
        return gameList.filter(game => {
            if (newPromotion.tagType === 'category') {
                return game.category && game.category.includes(newPromotion.tagValue);
            } else {
                return game.platform && game.platform.includes(newPromotion.tagValue);
            }
        }).length;
    };
    
    const renderItem = ({ item }) => {
        const isActive = new Date() >= new Date(item.startDate) && new Date() <= new Date(item.endDate);
        
        return (
            <View style={styles.promotionItem}>
                <View style={styles.promotionHeader}>
                    <Text style={styles.promotionTitle}>{item.name}</Text>
                    <View style={[styles.statusBadge, isActive ? styles.activeBadge : styles.inactiveBadge]}>
                        <Text style={styles.statusText}>{isActive ? 'Ativa' : 'Inativa'}</Text>
                    </View>
                </View>
                
                <View style={styles.promotionDetails}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Desconto:</Text>
                        <Text style={styles.discountValue}>{item.discountPercentage}%</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Aplicado a:</Text>
                        <Text style={styles.detailValue}>
                            {item.tagType === 'category' ? 'Categoria' : 'Plataforma'}: {item.tagValue}
                        </Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Período:</Text>
                        <Text style={styles.detailValue}>
                            {new Date(item.startDate).toLocaleDateString()} até {new Date(item.endDate).toLocaleDateString()}
                        </Text>
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
                        onPress={() => deletePromotion(item.id)}
                    >
                        <Text style={styles.buttonText}>Deletar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };
    
    const [showAlert, setShowAlert] = React.useState(false);
    const [promotionToDelete, setPromotionToDelete] = React.useState(null);
    
    const showDeleteConfirmation = (id) => {
        setPromotionToDelete(id);
        setShowAlert(true);
    };
    
    return (
        <View style={styles.container}>
            <ScrollView style={styles.inputContainer}>
                <Text style={styles.formTitle}>Gerenciar Promoções</Text>
                
                <TextInput
                    style={[
                        styles.input,
                        errors.name && styles.inputError
                    ]}
                    placeholder="Nome da Promoção *"
                    value={newPromotion.name}
                    onChangeText={(text) => {
                        setNewPromotion({ ...newPromotion, name: text });
                        setErrors({ ...errors, name: false });
                    }}
                />
                {errors.name && <Text style={styles.errorText}>Nome é obrigatório</Text>}
                
                <TextInput
                    style={[
                        styles.input,
                        errors.discountPercentage && styles.inputError
                    ]}
                    placeholder="Porcentagem de Desconto (1-99) *"
                    value={newPromotion.discountPercentage}
                    keyboardType="numeric"
                    onChangeText={(text) => {
                        const numericOnly = text.replace(/[^0-9]/g, '');
                        setNewPromotion({ ...newPromotion, discountPercentage: numericOnly });
                        setErrors({ ...errors, discountPercentage: false });
                    }}
                />
                {errors.discountPercentage && <Text style={styles.errorText}>Desconto deve ser entre 1% e 99%</Text>}
                
                <Text style={styles.inputLabel}>Aplicar desconto por:</Text>
                <View style={styles.radioContainer}>
                    <TouchableOpacity 
                        style={styles.radioOption}
                        onPress={() => setNewPromotion({ ...newPromotion, tagType: 'category', tagValue: '' })}
                    >
                        <View style={[
                            styles.radioButton,
                            newPromotion.tagType === 'category' && styles.radioButtonSelected
                        ]}>
                            {newPromotion.tagType === 'category' && <View style={styles.radioButtonInner} />}
                        </View>
                        <Text style={styles.radioLabel}>Categoria</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.radioOption}
                        onPress={() => setNewPromotion({ ...newPromotion, tagType: 'platform', tagValue: '' })}
                    >
                        <View style={[
                            styles.radioButton,
                            newPromotion.tagType === 'platform' && styles.radioButtonSelected
                        ]}>
                            {newPromotion.tagType === 'platform' && <View style={styles.radioButtonInner} />}
                        </View>
                        <Text style={styles.radioLabel}>Plataforma</Text>
                    </TouchableOpacity>
                </View>
                
                <Text style={styles.inputLabel}>
                    Selecione {newPromotion.tagType === 'category' ? 'a categoria' : 'a plataforma'} *
                </Text>
                <View style={styles.tagContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {(newPromotion.tagType === 'category' ? categoryTags : platformTags).map((tag, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.tag,
                                    newPromotion.tagValue === tag && styles.selectedTag
                                ]}
                                onPress={() => {
                                    setNewPromotion({ ...newPromotion, tagValue: tag });
                                    setErrors({ ...errors, tagValue: false });
                                }}
                            >
                                <Text style={[
                                    styles.tagText,
                                    newPromotion.tagValue === tag && styles.selectedTagText
                                ]}>
                                    {tag}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
                {errors.tagValue && <Text style={styles.errorText}>
                    {newPromotion.tagType === 'category' ? 'Categoria' : 'Plataforma'} é obrigatória
                </Text>}
                
                {newPromotion.tagValue && (
                    <Text style={styles.affectedGamesText}>
                        Esta promoção afetará {getAffectedGamesCount()} jogo(s)
                    </Text>
                )}
                
                <Text style={styles.inputLabel}>Data de Início *</Text>
                <TextInput
                    style={[
                        styles.input,
                        errors.startDate && styles.inputError
                    ]}
                    placeholder="AAAA-MM-DD"
                    value={newPromotion.startDate}
                    onChangeText={(text) => {
                        setNewPromotion({ ...newPromotion, startDate: text });
                        setErrors({ ...errors, startDate: false });
                    }}
                />
                {errors.startDate && <Text style={styles.errorText}>Data de início é obrigatória</Text>}
                
                <Text style={styles.inputLabel}>Data de Término *</Text>
                <TextInput
                    style={[
                        styles.input,
                        errors.endDate && styles.inputError
                    ]}
                    placeholder="AAAA-MM-DD"
                    value={newPromotion.endDate}
                    onChangeText={(text) => {
                        setNewPromotion({ ...newPromotion, endDate: text });
                        setErrors({ ...errors, endDate: false });
                    }}
                />
                {errors.endDate && <Text style={styles.errorText}>Data de término deve ser posterior à data de início</Text>}
                
                {editingId ? (
                    <View style={styles.formButtonsContainer}>
                        <TouchableOpacity 
                            style={[styles.addButton, styles.updateButton]} 
                            onPress={updatePromotion}
                        >
                            <Text style={styles.buttonText}>Atualizar Promoção</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.addButton, styles.cancelButton]} 
                            onPress={cancelEdit}
                        >
                            <Text style={styles.buttonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity 
                        style={styles.addButton} 
                        onPress={addPromotion}
                    >
                        <Text style={styles.buttonText}>Adicionar Promoção</Text>
                    </TouchableOpacity>
                )}
                
                <Text style={styles.listTitle}>Promoções Cadastradas:</Text>
                
                {promotions.length === 0 ? (
                    <Text style={styles.emptyListText}>Nenhuma promoção cadastrada</Text>
                ) : (
                    <FlatList
                        data={promotions}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        style={styles.promotionList}
                    />
                )}
            </ScrollView>
            
            <AwesomeAlert
                show={showAlert}
                showProgress={false}
                title="Confirmar Exclusão"
                message="Tem certeza que deseja excluir esta promoção?"
                closeOnTouchOutside={true}
                closeOnHardwareBackPress={false}
                showCancelButton={true}
                showConfirmButton={true}
                cancelText="Cancelar"
                confirmText="Excluir"
                confirmButtonColor="#DD6B55"
                onCancelPressed={() => {
                    setShowAlert(false);
                }}
                onConfirmPressed={() => {
                    setShowAlert(false);
                    if (promotionToDelete) {
                        deletePromotion(promotionToDelete);
                        setPromotionToDelete(null);
                    }
                }}
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
        marginBottom: 20,
        color: '#333',
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 12,
        marginBottom: 15,
        fontSize: 16,
    },
    inputError: {
        borderColor: 'red',
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
        marginTop: -10,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    radioContainer: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    radioButton: {
        height: 20,
        width: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#4682B4',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    radioButtonSelected: {
        borderColor: '#4682B4',
    },
    radioButtonInner: {
        height: 10,
        width: 10,
        borderRadius: 5,
        backgroundColor: '#4682B4',
    },
    radioLabel: {
        fontSize: 16,
        color: '#333',
    },
    tagContainer: {
        marginBottom: 15,
    },
    tag: {
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginRight: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    selectedTag: {
        backgroundColor: '#4682B4',
        borderColor: '#4682B4',
    },
    tagText: {
        color: '#333',
        fontSize: 14,
    },
    selectedTagText: {
        color: '#fff',
    },
    affectedGamesText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 15,
        fontStyle: 'italic',
    },
    addButton: {
        backgroundColor: '#8a2be2',
        borderRadius: 5,
        padding: 15,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    formButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        marginBottom: 20,
    },
    updateButton: {
        flex: 1,
        marginRight: 5,
    },
    cancelButton: {
        flex: 1,
        marginLeft: 5,
        backgroundColor: '#999',
    },
    listTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 15,
        color: '#333',
    },
    emptyListText: {
        textAlign: 'center',
        color: '#666',
        fontStyle: 'italic',
        marginBottom: 20,
    },
    promotionList: {
        marginBottom: 20,
    },
    promotionItem: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    promotionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    promotionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },
    activeBadge: {
        backgroundColor: '#e6f7e6',
    },
    inactiveBadge: {
        backgroundColor: '#ffe6e6',
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    promotionDetails: {
        marginBottom: 15,
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
        width: 80,
    },
    detailValue: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    discountValue: {
        fontSize: 14,
        color: '#4682B4',
        fontWeight: 'bold',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    actionButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
        marginLeft: 10,
    },
    editButton: {
        backgroundColor: '#4682B4',
    },
    deleteButton: {
        backgroundColor: '#FF6B6B',
    },
});

export default PostScreen2;