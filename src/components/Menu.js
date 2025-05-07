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
                    onPress={() => deletegame(item.id)}
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
function PostScreen2() {
    const [promotions, setPromotions] = React.useState([]);
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
                    <TouchableOpacity style={styles.addButton} onPress={addPromotion}>
                        <Text style={styles.buttonText}>Adicionar Promoção</Text>
                    </TouchableOpacity>
                )}
                
                <Text style={styles.listTitle}>Promoções Cadastradas:</Text>
                <FlatList
                    data={promotions}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    style={styles.list}
                />
            </ScrollView>
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
                            default:
                                iconName = '';
                                break;
                        }
                        return <Icon name={iconName} size={size} color={color} />;
                    },
                    tabBarActiveTintColor: '#4a148c',
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
                <Tab.Screen
                    name="Ler API"
                    component={APIScreen}
                />
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
    listTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginVertical: 15,
        color: '#333',
        textAlign: 'center',
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10,
        marginBottom: 5,
    },
    errorText: {
        color: '#f44336',
        marginBottom: 10,
        fontSize: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
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
    
    addButton: {
        backgroundColor: '#4a148c',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 20,
    },
    formButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    updateButton: {
        backgroundColor: '#4a148c',
        flex: 1,
        marginRight: 5,
    },
    cancelButton: {
        backgroundColor: '#f44336',
        flex: 1,
        marginLeft: 5,
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
        backgroundColor: '#4a148c',
    },
    deleteButton: {
        backgroundColor: '#f44336',
    },
    
    list: {
        width: '100%',
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
    promotionItem: {
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
    promotionHeader: {
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
        color: '#4a148c',
        flex: 3,
    },
    promotionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4a148c',
        flex: 3,
    },
    
    gamePrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4CAF50',
        flex: 1,
        textAlign: 'right',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    originalPrice: {
        fontSize: 14,
        color: '#888',
        textDecorationLine: 'line-through',
        marginRight: 8,
    },
    discountedPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f44336',
    },
    
    gameDetails: {
        marginBottom: 10,
    },
    promotionDetails: {
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
    discountValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f44336',
    },
    
    descriptionContainer: {
        marginTop: 5,
    },
    description: {
        color: '#666',
        marginTop: 3,
        lineHeight: 20,
    },
    
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeBadge: {
        backgroundColor: '#4CAF50',
    },
    inactiveBadge: {
        backgroundColor: '#9e9e9e',
    },
    statusText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    discountBadge: {
        backgroundColor: '#f44336',
        color: 'white',
        fontWeight: 'bold',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        fontSize: 12,
        overflow: 'hidden',
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
        borderColor: '#4a148c',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    radioButtonSelected: {
        borderColor: '#4a148c',
    },
    radioButtonInner: {
        height: 10,
        width: 10,
        borderRadius: 5,
        backgroundColor: '#4a148c',
    },
    radioLabel: {
        fontSize: 16,
        color: '#333',
    },
    
    affectedGamesText: {
        fontSize: 14,
        color: '#4a148c',
        fontStyle: 'italic',
        marginBottom: 15,
    },
});